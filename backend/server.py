from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import base64
import os
import re
import socket

# Prefer LOCAL_UPLOAD_ROOT from env/.env so cPanel can point at a writable folder.
_LOCAL_UPLOAD_ENV = (os.environ.get("LOCAL_UPLOAD_ROOT") or "").strip()
LOCAL_UPLOAD_ROOT = Path(_LOCAL_UPLOAD_ENV).expanduser() if _LOCAL_UPLOAD_ENV else (ROOT_DIR / "local_uploads")
IMAGE_CACHE_DIR = LOCAL_UPLOAD_ROOT / ".imgcache"
from contextlib import asynccontextmanager
import csv as _csv
import io
import uuid
import jwt
import bcrypt
import logging
import json
from urllib.parse import quote, urlparse
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any, Literal, Tuple, Set

from pymysql.err import (
    Error as PyMySQLError,
    InterfaceError as PyMySQLInterfaceError,
    OperationalError as PyMySQLOperationalError,
    ProgrammingError as PyMySQLProgrammingError,
)

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, Header
from fastapi.responses import RedirectResponse, StreamingResponse


class _PassengerSafeFastAPI(FastAPI):
    """
    LiteSpeed Passenger / some cPanel setups pass WSGI (environ, start_response) directly
    to whatever callable is labeled `app` — raw FastAPI then fails:
    TypeError: FastAPI.__call__() missing ... 'send'.
    Detect Wsgi environ and defer to ASGIMiddleware on demand.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._wsgi_via_a2 = None

    def __call__(self, scope, receive=None, send=None):
        if (
            isinstance(scope, dict)
            and "wsgi.version" in scope
            and receive is not None
            and callable(receive)
            and send is None
        ):
            br = self._wsgi_via_a2
            if br is None:
                try:
                    from a2wsgi import ASGIMiddleware as _ASM
                except ImportError:
                    return _missing_a2wsgi_wsgi_handler(scope, receive)
                br = _ASM(self)
                self._wsgi_via_a2 = br
            return br(scope, receive)
        return super().__call__(scope, receive, send)


def _missing_a2wsgi_wsgi_handler(environ, start_response):
    msg = (
        "WSGI: install a2wsgi in this virtualenv and restart:\n"
        "  pip install 'a2wsgi==1.10.10'\n"
        "Prefer startup file passenger_wsgi.py + callable application.\n"
    ).encode("utf-8", errors="replace")
    start_response(
        "500 Internal Server Error",
        [("Content-Type", "text/plain; charset=utf-8"), ("Content-Length", str(len(msg)))],
    )
    return [msg]
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import aiomysql
from image_optimize import compress_uploaded_image, prepare_public_image
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
import requests

from email_notify import (
    admin_notify_email,
    send_booking_emails,
    send_contact_admin_email,
    send_notification_email,
    send_test_email,
    smtp_config_from_settings,
)

# ---------- App (FastAPI instance created after seed helpers; see lifespan below) ----------
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- MySQL (env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE or DB_NAME) ----------
_mysql_pool: Optional[aiomysql.Pool] = None

DOCUMENT_TABLES = frozenset({
    "vehicles", "bookings", "customers", "drivers", "branches", "maintenance",
    "payments", "promotions", "reviews", "blogs", "tickets", "notifications",
    "cms_pages", "vehicle_inspections", "team_members", "testimonials", "contact_messages",
    "marketing_services", "travel_guides", "vehicle_categories",
})


def _mysql_db_name() -> str:
    return os.environ.get("MYSQL_DATABASE") or os.environ.get("DB_NAME", "carrental")


def _mysql_connect_host_and_socket() -> Tuple[str, Optional[str]]:
    """
    Return (host, unix_socket) for aiomysql.

    cPanel / shared hosting: MYSQL_HOST=localhost often means a **Unix socket** only; aiomysql
    uses TCP by default and then fails or behaves oddly. Prefer:

    - `MYSQL_UNIX_SOCKET=/path/to/mysql.sock` (from cPanel “Connection strings”) → TCP not used for host.
    - Else if host is `localhost` and `MYSQL_USE_LOCALHOST_SOCKET` is not set → use `127.0.0.1` (TCP loopback).
    If MySQL user is only `user@localhost` (not `user@127.0.0.1`), set `MYSQL_USE_LOCALHOST_SOCKET=1` and
    configure `MYSQL_UNIX_SOCKET`, or add a MySQL user/host for 127.0.0.1 in cPanel.
    """
    raw = (os.environ.get("MYSQL_HOST") or "localhost").strip()
    sock = (os.environ.get("MYSQL_UNIX_SOCKET") or "").strip()
    use_socket_host = os.environ.get("MYSQL_USE_LOCALHOST_SOCKET", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    if sock:
        return "localhost", sock
    if raw.lower() in ("localhost", "::1") and not use_socket_host:
        return "127.0.0.1", None
    return raw, None


def _validate_mysql_env() -> None:
    host = (os.environ.get("MYSQL_HOST") or "").strip()
    user = (os.environ.get("MYSQL_USER") or "").strip()
    if not host or not user:
        raise RuntimeError(
            "Missing MYSQL_HOST or MYSQL_USER. "
            "Create backend/.env (see backend) or set these in your host environment."
        )


# Browsers send Origin: http://localhost:3000 — list it explicitly; regex-only mode fails on some hosts / Starlette builds.
_CORS_DEV_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://admin.novacarrentals.com",
    "https://www.admin.novacarrentals.com",
    "https://novacarrentals.com",
    "https://www.novacarrentals.com",


)

# Loose pattern (Starlette CORSMiddleware uses regex.match(origin)). Avoid over-strict \w hosts.
_CORS_ORIGIN_REGEX = r"(?i)^https?://[^\s]+$"

_cors_reflect_re = None  # compiled re for _CORS_ORIGIN_REGEX


def _cors_build() -> Tuple[List[str], Optional[str]]:
    """Return (explicit allow_origins, optional regex pattern for additional origins)."""
    raw = (os.environ.get("CORS_ORIGINS") or "*").strip()
    env_parts = [p.strip() for p in raw.split(",") if p.strip() and p.strip() != "*"]
    use_regex = raw == "" or "*" in raw.split(",") or (len(env_parts) == 0 and raw == "*")

    allow_origins: List[str] = []
    for o in _CORS_DEV_ORIGINS:
        if o not in allow_origins:
            allow_origins.append(o)
    for o in env_parts:
        if o not in allow_origins:
            allow_origins.append(o)

    if use_regex:
        return allow_origins, _CORS_ORIGIN_REGEX
    return allow_origins, None


def _cors_middleware_kwargs() -> Dict[str, Any]:
    """allow_credentials=True cannot use Origin *; echo request Origin via explicit list + optional regex."""
    allow_origins, rex = _cors_build()
    if rex:
        return {"allow_origins": allow_origins, "allow_origin_regex": rex}
    return {"allow_origins": allow_origins, "allow_origin_regex": None}


def _cors_reflect_origin(origin: Optional[str]) -> Optional[str]:
    """Origin string to reflect in Access-Control-Allow-Origin when allowed."""
    global _cors_reflect_re
    if not origin or not origin.strip():
        return None
    origin = origin.strip()
    allow_origins, rex_pat = _cors_build()
    if origin in allow_origins:
        return origin
    if rex_pat:
        if _cors_reflect_re is None:
            _cors_reflect_re = re.compile(rex_pat)
        if _cors_reflect_re.match(origin):
            return origin
    return None


class EnsureCORSMiddleware(BaseHTTPMiddleware):
    """Fallback: some proxies strip ACAO headers; ensure allowed Origins always get echoed."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        origin_h = request.headers.get("origin")
        if origin_h:
            refl = _cors_reflect_origin(origin_h)
            if refl and not response.headers.get("access-control-allow-origin"):
                response.headers["Access-Control-Allow-Origin"] = refl
                response.headers["Access-Control-Allow-Credentials"] = "true"
                if request.method.upper() == "OPTIONS":
                    response.headers.setdefault(
                        "Access-Control-Allow-Methods",
                        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    )
                    req_hdr = request.headers.get("access-control-request-headers")
                    response.headers.setdefault(
                        "Access-Control-Allow-Headers",
                        req_hdr or "Authorization, Content-Type, Accept",
                    )
        return response


def _json_dumps(obj: Any) -> str:
    return json.dumps(obj, default=str)


def _json_loads(raw: Any) -> Dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        return json.loads(raw)
    return json.loads(str(raw))


def _iso_to_naive_utc(ts: str) -> datetime:
    s = str(ts).replace(" ", "T")
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


async def mysql_get_pool() -> aiomysql.Pool:
    global _mysql_pool
    if _mysql_pool is None:
        _validate_mysql_env()
        pool_recycle = int(os.environ.get("MYSQL_POOL_RECYCLE", "3600"))
        host, unix_socket = _mysql_connect_host_and_socket()
        pool_kw: Dict[str, Any] = dict(
            host=host,
            port=int(os.environ.get("MYSQL_PORT", "3306")),
            user=os.environ["MYSQL_USER"].strip(),
            password=os.environ.get("MYSQL_PASSWORD", ""),
            db=_mysql_db_name(),
            charset="utf8mb4",
            autocommit=True,
            minsize=1,
            maxsize=16,
            pool_recycle=max(60, pool_recycle),
        )
        if unix_socket:
            pool_kw["unix_socket"] = unix_socket
        _mysql_pool = await aiomysql.create_pool(**pool_kw)
        logger.info(
            "mysql pool created (host=%s, unix_socket=%s, db=%s)",
            host,
            "yes" if unix_socket else "no",
            _mysql_db_name(),
        )
    return _mysql_pool


async def mysql_invalidate_pool() -> None:
    """Close the global pool so the next mysql_get_pool() creates a fresh one (recover from 'gone away')."""
    global _mysql_pool
    p = _mysql_pool
    _mysql_pool = None
    if p is not None:
        try:
            p.close()
            await p.wait_closed()
        except Exception:
            logger.exception("mysql_invalidate_pool: close failed")


def _mysql_is_duplicate_column_error(exc: BaseException, column: str) -> bool:
    msg = str(exc).lower()
    if "duplicate column" in msg and column.lower() in msg:
        return True
    args = getattr(exc, "args", ()) or ()
    if args and args[0] == 1060:
        return True
    return False


def _ddl_create_document_table(table: str) -> str:
    """DDL for JSON document collections (must match mysql_init_schema)."""
    idx_name = ("idx_" + table + "_created")[:64]
    return f"""
                CREATE TABLE IF NOT EXISTS `{table}` (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    document JSON NOT NULL,
                    created_at DATETIME(6) NOT NULL,
                    updated_at DATETIME(6) NOT NULL,
                    INDEX `{idx_name}` (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """


async def mysql_ensure_document_table(table: str) -> None:
    """Create a document table if missing (e.g. DB existed before new resources like team_members)."""
    if table not in DOCUMENT_TABLES:
        return
    pool = await mysql_get_pool()
    ddl = _ddl_create_document_table(table)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(ddl)


async def mysql_repair_all_document_tables() -> None:
    """Idempotent CREATE IF NOT EXISTS for every document table (upgrade / missed DDL on live DB)."""
    for tbl in sorted(DOCUMENT_TABLES):
        await mysql_ensure_document_table(tbl)


def _mysql_errno_from_error(exc: BaseException) -> Optional[int]:
    args = getattr(exc, "args", None)
    if not args:
        return None
    try:
        return int(args[0])
    except (TypeError, ValueError):
        return None


def _mysql_is_unknown_column_mysql(exc: BaseException, column: str) -> bool:
    """MySQL ER_BAD_FIELD_ERROR 1054 — pymysql often raises OperationalError (not ProgrammingError)."""
    if _mysql_errno_from_error(exc) != 1054:
        return False
    return column.lower() in str(exc).lower()


def _mysql_is_no_such_table(exc: BaseException, table: str) -> bool:
    """True if exc (or chained __cause__ / __context__) is MySQL unknown table for `table`."""
    if table not in DOCUMENT_TABLES:
        return False
    visited: set = set()

    def inspect(e: Optional[BaseException]) -> bool:
        if e is None or id(e) in visited:
            return False
        visited.add(id(e))
        if inspect(getattr(e, "__cause__", None)):
            return True
        ctx = getattr(e, "__context__", None)
        if ctx is not getattr(e, "__cause__", None) and inspect(ctx):
            return True
        if _mysql_errno_from_error(e) == 1146:
            return True
        if isinstance(e, PyMySQLError):
            msg = str(e).lower()
            if ("doesn't exist" in msg or "does not exist" in msg) and table in str(e):
                return True
        return False

    return inspect(exc)


async def _mysql_retry_on_missing_table(table: str, op):
    """Run op(); on unknown-table errors, CREATE IF NOT EXISTS and retry once."""
    try:
        return await op()
    except Exception as e:
        if not _mysql_is_no_such_table(e, table):
            raise
        logger.warning("mysql: repairing missing document table %r", table)
        try:
            await mysql_ensure_document_table(table)
        except Exception:
            logger.exception("mysql: CREATE IF NOT EXISTS failed for table %r", table)
            raise
        return await op()


async def _mysql_users_ensure_phone_column(cur) -> None:
    """Add users.phone for sign-up / profile (idempotent). Raises if migration cannot be applied."""
    try:
        await cur.execute(
            """
            SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'
            """
        )
        row = await cur.fetchone()
        cnt = int(row[0] if row is not None else 0)
        if cnt == 0:
            await cur.execute(
                "ALTER TABLE users ADD COLUMN phone VARCHAR(64) NULL DEFAULT NULL AFTER name"
            )
            logger.info("mysql: added column users.phone")
    except Exception as e:
        if _mysql_is_duplicate_column_error(e, "phone"):
            return
        logger.exception("mysql: could not ensure users.phone column")
        raise


async def mysql_ensure_users_phone_runtime() -> None:
    """Run users.phone migration outside init (e.g. after a 1054 Unknown column on SELECT)."""
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await _mysql_users_ensure_phone_column(cur)


async def _mysql_users_ensure_avatar_column(cur) -> None:
    """Add users.avatar_url for profile photo (idempotent)."""
    try:
        await cur.execute(
            """
            SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url'
            """
        )
        row = await cur.fetchone()
        cnt = int(row[0] if row is not None else 0)
        if cnt == 0:
            await cur.execute(
                "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL DEFAULT NULL AFTER phone"
            )
            logger.info("mysql: added column users.avatar_url")
    except Exception as e:
        if _mysql_is_duplicate_column_error(e, "avatar_url"):
            return
        logger.exception("mysql: could not ensure users.avatar_url column")
        raise


async def mysql_ensure_users_avatar_runtime() -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await _mysql_users_ensure_avatar_column(cur)


async def mysql_init_schema() -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(64) NOT NULL,
                    created_at VARCHAR(64) NOT NULL,
                    UNIQUE KEY ux_users_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            await _mysql_users_ensure_phone_column(cur)
            await _mysql_users_ensure_avatar_column(cur)
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    actor VARCHAR(255) NOT NULL,
                    action VARCHAR(255) NOT NULL,
                    target TEXT,
                    meta JSON NULL,
                    timestamp VARCHAR(64) NOT NULL,
                    ts_sort DATETIME(6) NOT NULL,
                    INDEX idx_activity_ts (ts_sort)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS files (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    storage_path VARCHAR(512) NOT NULL,
                    original_filename VARCHAR(512) NULL,
                    content_type VARCHAR(128) NULL,
                    size BIGINT NULL,
                    uploaded_by VARCHAR(255) NULL,
                    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
                    created_at VARCHAR(64) NOT NULL,
                    INDEX idx_files_path (storage_path)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    document JSON NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            for tbl in DOCUMENT_TABLES:
                await cur.execute(_ddl_create_document_table(tbl))


async def mysql_close() -> None:
    global _mysql_pool
    if _mysql_pool is not None:
        _mysql_pool.close()
        await _mysql_pool.wait_closed()
        _mysql_pool = None


async def _mysql_user_fetch_one(where_sql: str, param: Any, exclude_password: bool) -> Optional[Dict[str, Any]]:
    """Load one user row; retries on stale pool / missing profile columns (phone, avatar_url)."""
    sql = (
        "SELECT id, email, password_hash, name, phone, avatar_url, role, created_at FROM users WHERE "
        + where_sql
    )
    phone_migration_tried = False
    avatar_migration_tried = False
    for attempt in range(5):
        try:
            pool = await mysql_get_pool()
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute(sql, (param,))
                    row = await cur.fetchone()
            if not row:
                return None
            d = dict(row)
            if exclude_password:
                d.pop("password_hash", None)
            return d
        except (PyMySQLProgrammingError, PyMySQLOperationalError, PyMySQLInterfaceError) as e:
            if _mysql_is_unknown_column_mysql(e, "phone") and not phone_migration_tried:
                phone_migration_tried = True
                logger.warning("mysql: users.phone missing (errno 1054) — applying ALTER TABLE")
                await mysql_ensure_users_phone_runtime()
                continue
            if _mysql_is_unknown_column_mysql(e, "avatar_url") and not avatar_migration_tried:
                avatar_migration_tried = True
                logger.warning("mysql: users.avatar_url missing (errno 1054) — applying ALTER TABLE")
                await mysql_ensure_users_avatar_runtime()
                continue
            if isinstance(e, PyMySQLProgrammingError):
                raise
            if isinstance(e, PyMySQLOperationalError) and _mysql_errno_from_error(e) == 1054:
                raise
            logger.warning(
                "mysql user fetch: connection error (attempt %s/5): %s",
                attempt + 1,
                e,
            )
            await mysql_invalidate_pool()
            if attempt >= 4:
                raise
            continue
    return None


async def mysql_user_find_by_id(user_id: str, exclude_password: bool = False) -> Optional[Dict[str, Any]]:
    return await _mysql_user_fetch_one("id = %s", user_id, exclude_password)


async def mysql_user_find_by_email(email: str, exclude_password: bool = False) -> Optional[Dict[str, Any]]:
    return await _mysql_user_fetch_one("email = %s", email, exclude_password)


async def mysql_user_insert(doc: Dict[str, Any]) -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO users (id, email, password_hash, name, phone, avatar_url, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    doc["id"],
                    doc["email"],
                    doc["password_hash"],
                    doc["name"],
                    doc.get("phone"),
                    doc.get("avatar_url"),
                    doc["role"],
                    doc["created_at"],
                ),
            )


async def mysql_user_update_password(email: str, password_hash: str) -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (password_hash, email))


async def mysql_user_apply_patch(user_id: str, patch: Dict[str, Any]) -> None:
    """Update allowed columns on `users` (keys must be name, phone, and/or avatar_url)."""
    allowed = ("name", "phone", "avatar_url")
    cols = []
    vals: List[Any] = []
    for k in allowed:
        if k not in patch:
            continue
        cols.append(f"{k} = %s")
        vals.append(patch[k])
    if not cols:
        return
    vals.append(user_id)
    sql = "UPDATE users SET " + ", ".join(cols) + " WHERE id = %s"
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, vals)


async def mysql_users_list(limit: int = 500) -> List[Dict[str, Any]]:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, email, name, phone, avatar_url, role, created_at FROM users ORDER BY email LIMIT %s",
                (limit,),
            )
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def mysql_activity_insert(actor: str, action: str, target: str, meta: Dict[str, Any], ts: str) -> None:
    pool = await mysql_get_pool()
    log_id = str(uuid.uuid4())
    ts_sort = _iso_to_naive_utc(ts)
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO activity_logs (id, actor, action, target, meta, timestamp, ts_sort)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (log_id, actor, action, target, _json_dumps(meta), ts, ts_sort),
            )


async def mysql_activity_list(limit: int) -> List[Dict[str, Any]]:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, actor, action, target, meta, timestamp FROM activity_logs ORDER BY ts_sort DESC LIMIT %s",
                (limit,),
            )
            rows = await cur.fetchall()
    out: List[Dict[str, Any]] = []
    for r in rows:
        d = dict(r)
        m = d.get("meta")
        if m is not None and not isinstance(m, dict):
            d["meta"] = _json_loads(m)
        elif m is None:
            d["meta"] = {}
        out.append(d)
    return out


async def mysql_doc_insert(table: str, doc: Dict[str, Any]) -> None:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()
    params = (
        doc["id"],
        _json_dumps(doc),
        _iso_to_naive_utc(doc["created_at"]),
        _iso_to_naive_utc(doc["updated_at"]),
    )

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"INSERT INTO `{table}` (id, document, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                    params,
                )

    await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_insert_many(table: str, docs: List[Dict[str, Any]]) -> None:
    if table not in DOCUMENT_TABLES or not docs:
        return
    pool = await mysql_get_pool()
    rows = [
        (d["id"], _json_dumps(d), _iso_to_naive_utc(d["created_at"]), _iso_to_naive_utc(d["updated_at"]))
        for d in docs
    ]

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.executemany(
                    f"INSERT INTO `{table}` (id, document, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                    rows,
                )

    await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_find_one(table: str, item_id: str) -> Optional[Dict[str, Any]]:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Primary lookup by the table PK.
                await cur.execute(f"SELECT id, document FROM `{table}` WHERE id = %s", (item_id,))
                row = await cur.fetchone()

                # Compatibility fallback: some legacy data stored the id only inside document JSON.
                if not row:
                    await cur.execute(
                        f"""
                        SELECT id, document
                        FROM `{table}`
                        WHERE JSON_UNQUOTE(JSON_EXTRACT(document, '$.id')) <=> %s
                        LIMIT 1
                        """,
                        (str(item_id),),
                    )
                    row = await cur.fetchone()
        if not row:
            return None
        doc = _json_loads(row[1])
        # Always inject the real primary key from the table column.
        # This keeps frontend delete/update reliable even if legacy JSON didn't include `id`.
        if doc.get("id") != row[0]:
            doc["id"] = row[0]
        return doc

    return await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_list(
    table: str,
    limit: int,
    status: Optional[str] = None,
    eq_filters: Optional[Dict[str, str]] = None,
) -> List[Dict[str, Any]]:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()
    parts: List[str] = []
    params: List[Any] = []
    if status:
        parts.append("JSON_UNQUOTE(JSON_EXTRACT(document, '$.status')) <=> %s")
        params.append(status)
    if eq_filters:
        for k, v in eq_filters.items():
            parts.append(f"JSON_UNQUOTE(JSON_EXTRACT(document, '$.{k}')) <=> %s")
            params.append(str(v))
    clause = (" WHERE " + " AND ".join(parts)) if parts else ""
    sql = f"SELECT id, document FROM `{table}`{clause} ORDER BY created_at DESC LIMIT %s"
    params.append(limit)
    qparams = tuple(params)

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, qparams)
                fetched = await cur.fetchall()
        out: List[Dict[str, Any]] = []
        for r in fetched:
            try:
                doc = _json_loads(r[1])
                # Always inject the real primary key from the table column.
                if doc.get("id") != r[0]:
                    doc["id"] = r[0]
                out.append(doc)
            except (json.JSONDecodeError, TypeError, ValueError) as je:
                logger.warning("mysql_doc_list %s: skipping row with invalid document JSON: %s", table, je)
        return out

    return await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_count(table: str) -> int:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"SELECT COUNT(*) FROM `{table}`")
                row = await cur.fetchone()
        return int(row[0])

    return await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_update(table: str, item_id: str, doc: Dict[str, Any]) -> int:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()
    uparams = (_json_dumps(doc), _iso_to_naive_utc(doc["updated_at"]), item_id)

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"UPDATE `{table}` SET document = %s, updated_at = %s WHERE id = %s",
                    uparams,
                )
                return cur.rowcount

    return await _mysql_retry_on_missing_table(table, op)


async def mysql_doc_delete(table: str, item_id: str) -> int:
    if table not in DOCUMENT_TABLES:
        raise ValueError("invalid table")
    pool = await mysql_get_pool()

    async def op():
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                # First try: delete by the table PK.
                await cur.execute(f"DELETE FROM `{table}` WHERE id = %s", (item_id,))
                n = cur.rowcount
                if n:
                    return n

                # Compatibility fallback: delete by legacy JSON `document.id`.
                await cur.execute(
                    f"""
                    DELETE FROM `{table}`
                    WHERE JSON_UNQUOTE(JSON_EXTRACT(document, '$.id')) <=> %s
                    """,
                    (str(item_id),),
                )
                return cur.rowcount

    return await _mysql_retry_on_missing_table(table, op)


async def mysql_file_insert(doc: Dict[str, Any]) -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO files (id, storage_path, original_filename, content_type, size, uploaded_by, is_deleted, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    doc["id"],
                    doc["storage_path"],
                    doc.get("original_filename"),
                    doc["content_type"],
                    doc.get("size"),
                    doc.get("uploaded_by"),
                    0 if not doc.get("is_deleted") else 1,
                    doc["created_at"],
                ),
            )


async def mysql_file_find_by_path(path: str) -> Optional[Dict[str, Any]]:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                """SELECT id, storage_path, original_filename, content_type, size, uploaded_by, is_deleted, created_at
                FROM files WHERE storage_path = %s AND is_deleted = 0""",
                (path,),
            )
            row = await cur.fetchone()
    return dict(row) if row else None


async def mysql_file_soft_delete(file_id: str) -> int:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE files SET is_deleted = 1 WHERE id = %s", (file_id,))
            return cur.rowcount


async def mysql_settings_get() -> Optional[Dict[str, Any]]:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT document FROM settings WHERE id = %s", ("global",))
            row = await cur.fetchone()
    if not row:
        return None
    return _json_loads(row[0])


async def mysql_settings_upsert(doc: Dict[str, Any]) -> None:
    pool = await mysql_get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO settings (id, document) VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE document = VALUES(document)""",
                ("global", _json_dumps(doc)),
            )


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def get_jwt_secret() -> str:
    v = os.environ.get("JWT_SECRET")
    if v is None or not str(v).strip():
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not set on this server — add JWT_SECRET to the API .env (this is a configuration error, not a temporary outage).",
        )
    return str(v).strip()

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await mysql_user_find_by_id(payload["sub"], exclude_password=True)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_activity(actor: str, action: str, target: str = "", meta: Optional[dict] = None):
    await mysql_activity_insert(actor, action, target, meta or {}, now_iso())


_ALLOWED_REG_AVATAR_CT = frozenset({"image/jpeg", "image/png", "image/gif", "image/webp"})


def _decode_registration_avatar_data_url(raw: Optional[str]) -> Tuple[bytes, str]:
    """Decode data:image/...;base64,... from the browser; raises ValueError if invalid."""
    s = (raw or "").strip()
    if not s:
        raise ValueError("empty")
    if len(s) > 700_000:
        raise ValueError("Profile image payload is too large")
    m = re.match(r"^data:(image/(?:jpeg|png|gif|webp));base64,([\s\S]+)$", s, re.IGNORECASE)
    if not m:
        raise ValueError("Profile image must be a data URL (JPEG, PNG, WebP, or GIF)")
    ct = m.group(1).lower()
    if ct not in _ALLOWED_REG_AVATAR_CT:
        raise ValueError("Unsupported image type for profile")
    b64 = re.sub(r"\s+", "", m.group(2))
    try:
        data = base64.b64decode(b64, validate=True)
    except Exception as err:
        raise ValueError("Invalid base64 image data") from err
    if len(data) > 600 * 1024:
        raise ValueError("Profile image must be 600 KB or smaller after decoding")
    return data, ct


async def _persist_registration_avatar(
    user_id: str,
    email: str,
    data: bytes,
    content_type: str,
) -> str:
    """Save bytes under local_uploads, register in files table; returns storage_path."""
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}.get(
        content_type,
        "bin",
    )
    storage_path = f"{APP_NAME}/user_avatars/{user_id}.{ext}"
    save_local_upload(storage_path, data)
    fid = str(uuid.uuid4())
    ts = now_iso()
    await mysql_file_insert(
        {
            "id": fid,
            "storage_path": storage_path,
            "original_filename": f"avatar.{ext}",
            "content_type": content_type,
            "size": len(data),
            "uploaded_by": email,
            "is_deleted": False,
            "created_at": ts,
        }
    )
    return storage_path


# ---------- Pydantic Models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=7, max_length=32)
    avatar_data_url: Optional[str] = Field(None, max_length=700000)

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class MeProfilePatchIn(BaseModel):
    """Partial update for the signed-in user (marketing site profile)."""

    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    phone: Optional[str] = Field(None, max_length=64)
    avatar_data_url: Optional[str] = Field(None, max_length=700000)

# Generic CRUD models use dict for flexibility
class VehicleIn(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: str
    brand: str
    model_name: str
    description: Optional[str] = Field(None, max_length=8000)
    category: str = "Sedan"
    registration_number: str
    year: int = 2024
    fuel_type: str = "Petrol"
    transmission: str = "Automatic"
    seats: int = 5
    daily_rate: float = 50.0
    weekly_rate: Optional[float] = None
    monthly_rate: Optional[float] = None
    hourly_rate: Optional[float] = None
    discount_rate: Optional[float] = None
    deposit_amount: Optional[float] = None
    insurance_cost: Optional[float] = None
    extra_charges: Optional[float] = None
    driver_fee: Optional[float] = None
    late_return_fee: Optional[float] = None
    airport_pickup_fee: Optional[float] = None
    fuel_policy: Optional[str] = None
    status: str = "available"  # available|reserved|rented|maintenance|out_of_service
    mileage: float = 0.0
    image_url: Optional[str] = None
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    image_side: Optional[str] = None
    image_interior: Optional[str] = None
    insurance_expiry: Optional[str] = None
    branch_id: Optional[str] = None
    features: List[str] = []
    comfort_features: List[str] = []
    safety_features: List[str] = []
    condition: str = "Excellent"
    gps_enabled: bool = False
    air_conditioning: bool = True
    bluetooth_usb: bool = False
    android_auto_carplay: bool = False
    backup_camera: bool = False
    parking_sensors: bool = False
    cruise_control: bool = False
    heated_seats: bool = False
    leather_seats: bool = False
    sunroof: bool = False
    child_seat_support: bool = False
    wifi_available: bool = False
    tracking_system: bool = False
    abs_brakes: bool = True
    airbags: bool = True
    stability_control: bool = False
    lane_assist: bool = False
    emergency_braking: bool = False
    tire_pressure_monitoring: bool = False
    security_alarm: bool = False
    engine_size: Optional[str] = None
    horsepower: Optional[int] = None
    fuel_consumption: Optional[str] = None
    doors: Optional[int] = None
    luggage_capacity: Optional[str] = None
    mileage_limit_per_day: Optional[float] = None
    cancellation_policy: Optional[str] = "Free cancellation up to 24 hours before pickup"
    smoking_policy: Optional[str] = "Smoking is strictly prohibited inside the vehicle"
    pets_policy: Optional[str] = "Pets allowed only with prior approval"
    cross_border_policy: Optional[str] = "Allowed for Rwanda, Uganda, and Tanzania with prior notice"
    min_driver_age: Optional[int] = 18
    license_requirements: Optional[str] = "Valid national driving license required"
    id_requirements: Optional[str] = "Valid ID or passport required at pickup"
    international_license_policy: Optional[str] = "International Driving Permit accepted"
    payment_methods: List[str] = Field(
        default_factory=lambda: ["Cash", "Mobile Money", "Bank Transfer", "Card"]
    )
    verified_vehicle: bool = False
    gallery_images: List[str] = []  # list of storage paths

class VehicleInspectionIn(BaseModel):
    vehicle_id: str
    inspector: str
    inspection_date: str
    overall_condition: str = "Good"  # Excellent|Good|Fair|Poor
    mileage: float = 0.0
    notes: str = ""
    issues_found: List[str] = []
    photo_paths: List[str] = []
    next_inspection_date: Optional[str] = None

class BookingIn(BaseModel):
    customer_id: str
    vehicle_id: str
    driver_id: Optional[str] = None
    pickup_date: str
    return_date: str
    pickup_location: str
    return_location: str
    total_amount: float = 0.0
    status: str = "pending"  # pending|confirmed|ongoing|completed|cancelled
    payment_status: str = "pending"
    notes: Optional[str] = None

class CustomerIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    license_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_blacklisted: bool = False
    loyalty_points: int = 0
    wallet_balance: float = 0.0

class DriverIn(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    license_number: str
    is_available: bool = True
    salary: float = 0.0
    rating: float = 4.5
    trips_completed: int = 0
    branch_id: Optional[str] = None

class BranchIn(BaseModel):
    name: str
    city: str
    address: str
    manager: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_pickup: bool = True
    is_return: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None


class VehicleCategoryIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = 0
    is_active: bool = True

class MaintenanceIn(BaseModel):
    vehicle_id: str
    type: str  # oil_change|tire|repair|inspection|other
    description: str
    cost: float = 0.0
    scheduled_date: str
    completed_date: Optional[str] = None
    status: str = "scheduled"
    garage: Optional[str] = None

class PaymentIn(BaseModel):
    booking_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: float
    method: str = "card"  # card|cash|bank_transfer|mobile_money
    type: str = "payment"  # payment|deposit|refund
    status: str = "completed"
    reference: Optional[str] = None

class PromotionIn(BaseModel):
    code: str
    description: str
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    valid_from: str
    valid_until: str
    is_active: bool = True
    usage_limit: int = 100
    used_count: int = 0

class ReviewIn(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    rating: float
    comment: str
    is_approved: bool = False
    is_hidden: bool = False

class BlogIn(BaseModel):
    title: str
    slug: str
    category: str = "General"
    tags: List[str] = []
    content: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: bool = False
    author: str = "Admin"


class TravelGuideSectionIn(BaseModel):
    heading: str = ""
    body: str = ""
    tip: Optional[str] = None
    image: Optional[str] = None


class TravelGuideVehicleIn(BaseModel):
    id: str = ""
    name: str = ""
    reason: str = ""


class TravelGuideInfoIn(BaseModel):
    label: str = ""
    value: str = ""


class TravelGuideIn(BaseModel):
    slug: str = Field(..., min_length=1, max_length=120)
    title: str = Field(..., min_length=1, max_length=300)
    subtitle: str = ""
    category: str = "Road Trip"
    country: str = ""
    flag: str = ""
    read_time: str = "5 min read"
    cover_gradient: str = "from-emerald-950 via-green-900 to-emerald-800"
    cover_image: Optional[str] = None
    card_image: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    accent_color: str = "text-emerald-400"
    tags: List[str] = []
    intro: str = ""
    sections: List[TravelGuideSectionIn] = []
    recommended_vehicles: List[TravelGuideVehicleIn] = []
    practical_info: List[TravelGuideInfoIn] = []
    best_months: str = ""
    difficulty: str = "Moderate"
    cta_text: str = "Book your vehicle for this journey"
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    display_order: int = 0
    is_published: bool = False

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, v: str) -> str:
        normalized = _normalize_guide_slug(v)
        if not normalized:
            raise ValueError("slug must contain at least one letter or number")
        return normalized

class TicketIn(BaseModel):
    subject: str
    customer_email: str
    description: str
    priority: str = "medium"  # low|medium|high
    status: str = "open"  # open|in_progress|resolved|closed

class NotificationIn(BaseModel):
    type: str  # booking|payment|maintenance|system
    title: str
    message: str
    channel: str = "in_app"  # in_app|email|sms|whatsapp
    recipient_email: Optional[EmailStr] = None
    is_read: bool = False

class DestinationParkIn(BaseModel):
    name: str = ""
    highlight: str = ""


class DestinationCountryIn(BaseModel):
    name: str = ""
    tagline: str = ""
    description: str = ""
    icon: str = "mountain"  # mountain|trees|waves
    cities: List[str] = []
    parks: List[DestinationParkIn] = []
    img_bg: str = "bg-gradient-to-br from-green-900/30 to-background"
    cover_image: Optional[str] = None
    display_order: int = 0


class DestinationAirportIn(BaseModel):
    city: str = ""
    country: str = ""
    code: str = ""
    airport: str = ""


class ServiceItemIn(BaseModel):
    icon: str = "car"  # car|user-check|plane|building|camera|calendar
    title: str = ""
    tagline: str = ""
    description: str = ""
    perks: List[str] = []
    cta_text: str = "Book Now"
    display_order: int = 0


class CMSPageIn(BaseModel):
    key: str  # about|service|contact|faq|privacy|terms|home_hero (legacy demos may still have "services")
    title: str
    content: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_published: bool = True
    # Home page hero (optional; used when key=home)
    hero_image: Optional[str] = None
    # About page sections (optional; used when key=about)
    hero_eyebrow: Optional[str] = None
    story_title: Optional[str] = None
    story_content: Optional[str] = None
    stats: Optional[List[Dict[str, str]]] = None
    values: Optional[List[Dict[str, str]]] = None
    promises: Optional[List[str]] = None
    cta_title: Optional[str] = None
    cta_description: Optional[str] = None
    story_image_rw: Optional[str] = None
    story_image_ug: Optional[str] = None
    story_image_tz: Optional[str] = None
    story_quote: Optional[str] = None
    # Destinations page (optional; used when key=destinations)
    destination_countries: Optional[List[DestinationCountryIn]] = None
    airports_eyebrow: Optional[str] = None
    airports_title: Optional[str] = None
    airports_intro: Optional[str] = None
    destination_airports: Optional[List[DestinationAirportIn]] = None
    cross_border_eyebrow: Optional[str] = None
    cross_border_title: Optional[str] = None
    cross_border_description: Optional[str] = None
    cross_border_button: Optional[str] = None
    # Services page (optional; used when key=service)
    service_items: Optional[List[ServiceItemIn]] = None
    perfect_for_eyebrow: Optional[str] = None
    perfect_for_title: Optional[str] = None
    perfect_for_items: Optional[List[str]] = None
    bottom_cta_title: Optional[str] = None
    bottom_cta_description: Optional[str] = None
    bottom_cta_button: Optional[str] = None


class TeamMemberIn(BaseModel):
    full_name: str
    role: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: str = ""
    photo_path: Optional[str] = None
    display_order: int = 0
    is_visible: bool = True


class TestimonialIn(BaseModel):
    """Public marketing quotes (name, quote, headshot, star rating)."""

    name: str
    role: str = ""
    testimonial: str
    profile_image: Optional[str] = None
    rating: int = Field(default=5, ge=1, le=5)
    display_order: int = 0
    is_visible: bool = True


class MarketingServiceIn(BaseModel):
    """Marketing site /service cards (title + body); managed via authenticated CRUD."""

    title: str = Field(..., min_length=1, max_length=400)
    body: str = Field(default="", max_length=12000)
    display_order: int = 0
    is_published: bool = True


class ContactMessageIn(BaseModel):
    """Website contact form submission (marketing site → admin inbox)."""

    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=500)
    message: str = Field(..., min_length=1, max_length=8000)


class PublicBookingIn(BaseModel):
    """Public marketing-site booking request (no auth). Creates `bookings` + finds/creates `customers` by email."""

    vehicle_id: str = Field(..., min_length=1, max_length=80)
    pickup_date: str = Field(..., min_length=8, max_length=40, description="YYYY-MM-DD")
    return_date: str = Field(..., min_length=8, max_length=40, description="YYYY-MM-DD")
    pickup_branch_id: Optional[str] = Field(None, max_length=80)
    return_branch_id: Optional[str] = Field(None, max_length=80)
    return_same: bool = True
    guest_full_name: str = Field(..., min_length=1, max_length=200)
    guest_email: EmailStr
    guest_phone: str = Field(..., min_length=5, max_length=48)
    notes: Optional[str] = Field(None, max_length=4000)


class SettingsIn(BaseModel):
    company_name: str = "NovaCar Admin"
    logo_url: Optional[str] = None
    currency: Literal["USD", "RWF"] = "USD"
    timezone: str = "UTC"
    language: str = "en"
    deposit_rule: str = "20% of total"
    late_return_charge_per_hour: float = 10.0
    fuel_policy: str = "Return with full tank"
    smtp_host: Optional[str] = "novacarrentals.com"
    smtp_port: int = 465
    smtp_use_ssl: bool = True
    smtp_user: Optional[str] = "support@novacarrentals.com"
    smtp_from_email: Optional[str] = "support@novacarrentals.com"
    notification_email_to: Optional[str] = "support@novacarrentals.com"
    payment_gateway: str = "Stripe"
    sms_provider: str = "Twilio"
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_description: Optional[str] = None
    website_url: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    # Public marketing site (CanvasTours footer, etc.)
    footer_tagline: Optional[str] = None
    footer_description: Optional[str] = None
    footer_credit_line: Optional[str] = None
    business_hours_text: Optional[str] = None
    social_facebook_url: Optional[str] = None
    social_twitter_url: Optional[str] = None  # X (Twitter) profile or post URL
    social_instagram_url: Optional[str] = None
    social_linkedin_url: Optional[str] = None
    social_youtube_url: Optional[str] = None
    social_whatsapp_url: Optional[str] = None  # e.g. https://wa.me/15551234567
    social_tiktok_url: Optional[str] = None  # e.g. https://www.tiktok.com/@handle
    # Public marketing site <head> (index.html) — editable in admin Settings
    site_seo_title: Optional[str] = None
    site_meta_description: Optional[str] = None
    site_robots: str = "index, follow"
    og_image_url: Optional[str] = None
    twitter_card: str = "summary_large_image"


class TestEmailIn(BaseModel):
    to: Optional[EmailStr] = None


@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    try:
        email = payload.email.lower()
        user = await mysql_user_find_by_email(email, exclude_password=False)
        if not user or not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        access = create_access_token(user["id"], email)
        refresh = create_refresh_token(user["id"])
        set_auth_cookies(response, access, refresh)
        try:
            await log_activity(user["email"], "login")
        except (PyMySQLOperationalError, PyMySQLInterfaceError):
            logger.warning("login: activity log skipped (mysql)")
        except Exception:
            logger.exception("login: activity log skipped")
        return {"user": UserOut(**user).model_dump(), "access_token": access, "refresh_token": refresh}
    except (PyMySQLOperationalError, PyMySQLInterfaceError):
        logger.exception("login failed: mysql not reachable (check MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE on the server)")
        raise HTTPException(
            status_code=503,
            detail=(
                "Database unreachable from this API after reconnect attempts. "
                "Check MYSQL_* and DB_NAME on the server. On cPanel, if MYSQL_HOST was localhost, "
                "the API now connects via 127.0.0.1 (TCP); if you get Access denied, add a MySQL user "
                "allowed for 127.0.0.1 or set MYSQL_UNIX_SOCKET to your host’s MySQL socket path and "
                "MYSQL_USE_LOCALHOST_SOCKET=1. JWT misconfig returns 500, not 503."
            ),
        ) from None

@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    """Public sign-up for marketing / renter accounts (not elevated admin). Admins use seed + ADMIN_EMAIL."""
    email = payload.email.lower()
    if await mysql_user_find_by_email(email, exclude_password=False):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    role = (os.environ.get("PUBLIC_REGISTER_DEFAULT_ROLE") or "customer").strip() or "customer"
    phone = re.sub(r"\s+", " ", (payload.phone or "").strip())
    avatar_ref: Optional[str] = None
    if payload.avatar_data_url and str(payload.avatar_data_url).strip():
        try:
            raw_b, ct = _decode_registration_avatar_data_url(str(payload.avatar_data_url))
            avatar_ref = await _persist_registration_avatar(user_id, email, raw_b, ct)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve)) from None
    doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "phone": phone or None,
        "avatar_url": avatar_ref,
        "password_hash": hash_password(payload.password),
        "role": role,
        "created_at": now_iso(),
    }
    await mysql_user_insert(doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    fresh = await mysql_user_find_by_id(user_id, exclude_password=True)
    if not fresh:
        raise HTTPException(status_code=500, detail="Registration incomplete")
    return {
        "user": UserOut(**fresh).model_dump(),
        "access_token": access,
        "refresh_token": refresh,
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api_router.patch("/auth/me")
async def patch_me(payload: MeProfilePatchIn, user=Depends(get_current_user)):
    """Update name, phone, and/or avatar for the current user."""
    uid = str(user.get("id") or "")
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = str(user.get("email") or "")
    body = payload.model_dump(exclude_unset=True)
    patch_db: Dict[str, Any] = {}

    if "name" in body:
        n = str(body.get("name") or "").strip()
        if not n:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        patch_db["name"] = n

    if "phone" in body:
        p = re.sub(r"\s+", " ", str(body.get("phone") or "").strip())
        patch_db["phone"] = p or None

    if "avatar_data_url" in body and str(body.get("avatar_data_url") or "").strip():
        try:
            raw_b, ct = _decode_registration_avatar_data_url(
                str(body["avatar_data_url"]).strip()
            )
            patch_db["avatar_url"] = await _persist_registration_avatar(
                uid, email, raw_b, ct
            )
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve)) from None

    if patch_db:
        await mysql_user_apply_patch(uid, patch_db)

    fresh = await mysql_user_find_by_id(uid, exclude_password=True)
    if not fresh:
        raise HTTPException(status_code=500, detail="Profile update incomplete")
    return UserOut(**fresh).model_dump()


@api_router.get("/me/bookings")
async def list_my_bookings(user=Depends(get_current_user), limit: int = Query(50, ge=1, le=200)):
    """
    Authenticated renter: bookings linked to any `customers` document whose email matches the logged-in user.
    """
    email = str(user.get("email") or "").strip().lower()
    if not email:
        return []
    try:
        customers = await mysql_doc_list("customers", 2000)
    except Exception:
        logger.exception("list_my_bookings: list customers failed")
        return []
    cids = {
        str(c.get("id"))
        for c in customers
        if str(c.get("email") or "").strip().lower() == email and c.get("id")
    }
    if not cids:
        return []
    try:
        all_bookings = await mysql_doc_list("bookings", 2000)
        vehicles = await mysql_doc_list("vehicles", 2000)
    except Exception:
        logger.exception("list_my_bookings: list bookings/vehicles failed")
        return []
    vmap = {str(v.get("id")): v for v in vehicles if v.get("id")}
    # Match by linked customer OR guest email snapshot (marketing bookings / same email as account).
    rows: List[Dict[str, Any]] = []
    seen_ids = set()
    for b in all_bookings:
        bid = str(b.get("id") or "")
        if not bid or bid in seen_ids:
            continue
        cid = str(b.get("customer_id") or "")
        guest = str(b.get("guest_email_snapshot") or "").strip().lower()
        if cid in cids or guest == email:
            seen_ids.add(bid)
            rows.append(b)
    rows.sort(key=lambda x: str(x.get("pickup_date") or x.get("created_at") or ""), reverse=True)
    out: List[Dict[str, Any]] = []
    for b in rows[:limit]:
        vid = str(b.get("vehicle_id") or "")
        v = vmap.get(vid)
        out.append(
            {
                "id": b.get("id"),
                "pickup_date": b.get("pickup_date"),
                "return_date": b.get("return_date"),
                "pickup_location": b.get("pickup_location"),
                "return_location": b.get("return_location"),
                "total_amount": b.get("total_amount"),
                "status": b.get("status"),
                "payment_status": b.get("payment_status"),
                "vehicle_id": b.get("vehicle_id"),
                "vehicle_name": (v.get("name") if v else None)
                or b.get("vehicle_name_snapshot"),
                "vehicle_brand": (v.get("brand") if v else None),
                "vehicle_model": (v.get("model_name") if v else None),
                "vehicle_category": (v.get("category") if v else None),
            }
        )
    return out


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(rt, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await mysql_user_find_by_id(payload["sub"], exclude_password=False)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", new_access, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ---------- Generic CRUD Factory ----------
def make_crud_routes(name: str, collection: str, model_cls, on_create=None, on_delete=None):
    @api_router.get(f"/{name}")
    async def list_items(user=Depends(get_current_user), q: Optional[str] = None, status: Optional[str] = None, limit: int = 500):
        items = await mysql_doc_list(collection, limit, status=status, eq_filters=None)
        if q:
            ql = q.lower()
            items = [i for i in items if any(ql in str(v).lower() for v in i.values())]
        return items

    @api_router.post(f"/{name}")
    async def create_item(payload: model_cls, user=Depends(get_current_user)):
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["created_at"] = now_iso()
        doc["updated_at"] = now_iso()
        await mysql_doc_insert(collection, doc)
        if on_create:
            try:
                await on_create(doc)
            except Exception:
                logger.exception("on_create hook failed for %s", name)
        await log_activity(user["email"], f"create_{name}", doc["id"])
        doc.pop("_id", None)
        return doc

    @api_router.get(f"/{name}/{{item_id}}")
    async def get_item(item_id: str, user=Depends(get_current_user)):
        item = await mysql_doc_find_one(collection, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        return item

    @api_router.put(f"/{name}/{{item_id}}")
    async def update_item(item_id: str, payload: model_cls, user=Depends(get_current_user)):
        existing = await mysql_doc_find_one(collection, item_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        # Only merge fields the client actually sent — avoids wiping omitted optionals with null defaults.
        doc = {**existing, **payload.model_dump(exclude_unset=True)}
        doc["updated_at"] = now_iso()
        await mysql_doc_update(collection, item_id, doc)
        await log_activity(user["email"], f"update_{name}", item_id)
        updated = await mysql_doc_find_one(collection, item_id)
        return updated

    @api_router.delete(f"/{name}/{{item_id}}")
    async def delete_item(item_id: str, user=Depends(get_current_user)):
        existing = await mysql_doc_find_one(collection, item_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        if on_delete:
            try:
                await on_delete(existing)
            except HTTPException:
                raise
            except Exception:
                logger.exception("on_delete hook failed for %s", name)
                raise HTTPException(status_code=500, detail="Delete blocked")
        n = await mysql_doc_delete(collection, item_id)
        if n == 0:
            raise HTTPException(status_code=404, detail="Not found")
        await log_activity(user["email"], f"delete_{name}", item_id)
        return {"ok": True}

    return list_items, create_item, get_item, update_item, delete_item

# Register CRUD endpoints
make_crud_routes("vehicles", "vehicles", VehicleIn)
make_crud_routes("bookings", "bookings", BookingIn)
make_crud_routes("customers", "customers", CustomerIn)
make_crud_routes("drivers", "drivers", DriverIn)
make_crud_routes("branches", "branches", BranchIn)


async def _guard_vehicle_category_delete(doc: Dict[str, Any]) -> None:
    name = str(doc.get("name") or "").strip()
    if not name:
        return
    try:
        vehicles = await mysql_doc_list("vehicles", 5000)
    except Exception:
        logger.exception("_guard_vehicle_category_delete: list vehicles failed")
        raise HTTPException(status_code=503, detail="Could not verify vehicle usage")
    count = sum(1 for v in vehicles if str(v.get("category") or "").strip() == name)
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {count} vehicle(s) still use category '{name}'. Reassign them first.",
        )


make_crud_routes(
    "vehicle-categories",
    "vehicle_categories",
    VehicleCategoryIn,
    on_delete=_guard_vehicle_category_delete,
)
make_crud_routes("maintenance", "maintenance", MaintenanceIn)
make_crud_routes("payments", "payments", PaymentIn)
make_crud_routes("promotions", "promotions", PromotionIn)
make_crud_routes("reviews", "reviews", ReviewIn)
make_crud_routes("blogs", "blogs", BlogIn)
make_crud_routes("travel-guides", "travel_guides", TravelGuideIn)
make_crud_routes("tickets", "tickets", TicketIn)
make_crud_routes("cms_pages", "cms_pages", CMSPageIn)
make_crud_routes("vehicle_inspections", "vehicle_inspections", VehicleInspectionIn)
make_crud_routes("team_members", "team_members", TeamMemberIn)
make_crud_routes("testimonials", "testimonials", TestimonialIn)
make_crud_routes("service-cards", "marketing_services", MarketingServiceIn)
make_crud_routes("marketing-services", "marketing_services", MarketingServiceIn)
make_crud_routes("contact-messages", "contact_messages", ContactMessageIn)

# ---------- Object Storage ----------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "carrental"
storage_key: Optional[str] = None
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
}


def _normalize_storage_key(storage_path: str) -> str:
    return (storage_path or "").replace("\\", "/").strip().lstrip("/")


def _local_upload_candidate_roots() -> List[Path]:
    """Roots to search for uploaded files (Passenger cwd can differ from __file__)."""
    roots: List[Path] = []
    for candidate in (
        LOCAL_UPLOAD_ROOT,
        ROOT_DIR / "local_uploads",
        Path.cwd() / "local_uploads",
        Path.cwd() / "backend" / "local_uploads",
    ):
        try:
            resolved = candidate.resolve()
        except OSError:
            continue
        if resolved not in roots:
            roots.append(resolved)
    return roots


def _safe_path_under_root(base: Path, storage_path: str) -> Optional[Path]:
    normalized = _normalize_storage_key(storage_path)
    if not normalized or ".." in normalized.split("/"):
        return None
    try:
        full = (base / normalized).resolve()
        full.relative_to(base.resolve())
        return full
    except (OSError, ValueError):
        return None


def _safe_local_upload_path(storage_path: str) -> Path:
    """Resolve storage_path under LOCAL_UPLOAD_ROOT (blocks path traversal)."""
    normalized = _normalize_storage_key(storage_path)
    if not normalized:
        raise HTTPException(status_code=400, detail="Invalid path")
    base = LOCAL_UPLOAD_ROOT.resolve()
    full = (base / normalized).resolve()
    try:
        full.relative_to(base)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid path")
    return full


def _guess_upload_content_type(path: Path) -> str:
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }.get(path.suffix.lower(), "application/octet-stream")


def try_read_local_upload(storage_path: str) -> Optional[Tuple[bytes, str]]:
    """Return (bytes, content_type) if file exists under any known local_uploads root."""
    for root in _local_upload_candidate_roots():
        p = _safe_path_under_root(root, storage_path)
        if p is None or not p.is_file():
            continue
        try:
            return p.read_bytes(), _guess_upload_content_type(p)
        except OSError:
            logger.debug("try_read_local_upload failed path=%s", p, exc_info=True)
    return None


def save_local_upload(storage_path: str, content: bytes) -> None:
    """Persist bytes on server disk (always kept for reliable public image serving)."""
    p = _safe_local_upload_path(storage_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(content)


def fetch_file_bytes(storage_path: str) -> Tuple[bytes, str]:
    """Load file from local disk if present, otherwise from remote object storage."""
    local = try_read_local_upload(storage_path)
    if local:
        return local
    try:
        return get_object(storage_path)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("fetch_file_bytes: remote fetch failed path=%s", storage_path)
        raise HTTPException(status_code=404, detail="File not found") from e


_PUBLIC_IMAGE_CACHE_HEADERS = {
    "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400",
}


def _public_image_response(
    data: bytes,
    content_type: str,
    *,
    storage_path: str = "",
    width: Optional[int] = None,
) -> Response:
    """Compress/resize public images and send long-lived cache headers."""
    ct = (content_type or "").split(";")[0].strip() or "application/octet-stream"
    if not data:
        raise HTTPException(status_code=404, detail="Empty image")
    if ct.startswith("image/") and ct not in ("image/gif", "image/svg+xml"):
        try:
            data, ct = prepare_public_image(
                data,
                ct,
                storage_path=storage_path,
                width=width,
                cache_dir=IMAGE_CACHE_DIR,
            )
        except Exception:
            # Never let compression break public <img> delivery.
            logger.debug("public image compress skipped path=%s", storage_path, exc_info=True)
    return Response(content=data, media_type=ct, headers=_PUBLIC_IMAGE_CACHE_HEADERS)


def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        logger.warning("EMERGENT_LLM_KEY not set; object storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not configured")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 403:
        # refresh key and retry once
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        # Prefer a not-found response for <img> tags over a hard 503 when only remote
        # storage was ever written and EMERGENT_LLM_KEY is missing on this host.
        raise HTTPException(
            status_code=404,
            detail="File not found (no local copy; object storage not configured)",
        )
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        if not key:
            raise HTTPException(
                status_code=404,
                detail="File not found (no local copy; object storage not configured)",
            )
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key}, timeout=60,
        )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="File not found")
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

@api_router.post("/uploads")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Query("misc", description="Sub-folder, e.g. vehicles/{id}, inspections, customers"),
    user=Depends(get_current_user),
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_FILE_SIZE // 1024 // 1024} MB)")
    ct = file.content_type or "application/octet-stream"
    if ct not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Content type '{ct}' not allowed")
    ext = (file.filename or "file.bin").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "bin"
    if ct.startswith("image/") and ct != "image/gif":
        content, ct, ext = compress_uploaded_image(content, ct)
    safe_folder = folder.strip("/").replace("..", "")
    path = f"{APP_NAME}/{safe_folder}/{uuid.uuid4()}.{ext}"
    file_id = str(uuid.uuid4())
    storage_path = path
    try:
        result = put_object(path, content, ct)
        storage_path = result.get("path") or path
    except Exception as e:
        logger.warning(
            "Object storage upload failed (%s); keeping local_uploads/ copy only.",
            e,
        )
    # Always keep a local copy so /public/*-asset works without EMERGENT_LLM_KEY.
    try:
        save_local_upload(storage_path, content)
    except Exception as e:
        logger.error("Failed to save local upload %s: %s", storage_path, e)
        if not try_read_local_upload(storage_path):
            raise HTTPException(
                status_code=503,
                detail="Could not store file locally. Check LOCAL_UPLOAD_ROOT permissions.",
            ) from e
    await mysql_file_insert({
        "id": file_id,
        "storage_path": storage_path,
        "original_filename": file.filename,
        "content_type": ct,
        "size": len(content),
        "uploaded_by": user["email"],
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {
        "id": file_id,
        "path": storage_path,
        "url": f"/api/files/{storage_path}",
        "content_type": ct,
        "size": len(content),
        "original_filename": file.filename,
    }

@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request, auth: Optional[str] = Query(None)):
    # Allow either Authorization header OR ?auth=token query param (for <img src>)
    token = None
    if auth:
        token = auth
    else:
        ah = request.headers.get("Authorization", "")
        if ah.startswith("Bearer "):
            token = ah[7:]
        else:
            token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    record = await mysql_file_find_by_path(path)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, ct = fetch_file_bytes(path)
    return Response(content=data, media_type=record.get("content_type", ct))

@api_router.delete("/uploads/{file_id}")
async def delete_file(file_id: str, user=Depends(get_current_user)):
    n = await mysql_file_soft_delete(file_id)
    if n == 0:
        raise HTTPException(status_code=404, detail="Not found")
    await log_activity(user["email"], "delete_file", file_id)
    return {"ok": True}

# ---------- Dashboard Stats ----------
@api_router.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    vehicles = await mysql_doc_list("vehicles", 2000)
    bookings = await mysql_doc_list("bookings", 5000)
    customers_count = await mysql_doc_count("customers")
    drivers = await mysql_doc_list("drivers", 1000)
    payments = await mysql_doc_list("payments", 5000)

    total_cars = len(vehicles)
    available = sum(1 for v in vehicles if v.get("status") == "available")
    rented = sum(1 for v in vehicles if v.get("status") == "rented")
    maintenance = sum(1 for v in vehicles if v.get("status") == "maintenance")

    active_bookings = sum(1 for b in bookings if b.get("status") in ("confirmed", "ongoing"))
    completed_rentals = sum(1 for b in bookings if b.get("status") == "completed")
    pending_requests = sum(1 for b in bookings if b.get("status") == "pending")

    total_revenue = sum(p.get("amount", 0) for p in payments if p.get("type") == "payment" and p.get("status") == "completed")
    pending_payments = sum(1 for p in payments if p.get("status") == "pending")

    available_drivers = sum(1 for d in drivers if d.get("is_available"))

    # Revenue by month (last 6)
    revenue_by_month: Dict[str, float] = {}
    for p in payments:
        if p.get("type") != "payment" or p.get("status") != "completed":
            continue
        ts = p.get("created_at", "")
        if len(ts) >= 7:
            key = ts[:7]
            revenue_by_month[key] = revenue_by_month.get(key, 0) + float(p.get("amount", 0))
    revenue_chart = sorted([{"month": k, "revenue": round(v, 2)} for k, v in revenue_by_month.items()], key=lambda x: x["month"])[-6:]

    # Bookings by status
    booking_status_chart = []
    for st in ["pending", "confirmed", "ongoing", "completed", "cancelled"]:
        booking_status_chart.append({"status": st.capitalize(), "count": sum(1 for b in bookings if b.get("status") == st)})

    # Most rented vehicle (by booking count)
    veh_count: Dict[str, int] = {}
    for b in bookings:
        vid = b.get("vehicle_id")
        if vid:
            veh_count[vid] = veh_count.get(vid, 0) + 1
    most_rented = None
    if veh_count:
        top_id = max(veh_count, key=veh_count.get)
        v = next((x for x in vehicles if x["id"] == top_id), None)
        if v:
            most_rented = {"name": v["name"], "bookings": veh_count[top_id]}

    # Category distribution
    cat_chart: Dict[str, int] = {}
    for b in bookings:
        v = next((x for x in vehicles if x["id"] == b.get("vehicle_id")), None)
        if v:
            cat = v.get("category", "Other")
            cat_chart[cat] = cat_chart.get(cat, 0) + 1
    category_chart = [{"category": k, "count": v} for k, v in cat_chart.items()]

    # Recent activity
    activities = await mysql_activity_list(20)

    return {
        "total_cars": total_cars,
        "available_cars": available,
        "rented_cars": rented,
        "maintenance_cars": maintenance,
        "total_customers": customers_count,
        "active_bookings": active_bookings,
        "completed_rentals": completed_rentals,
        "pending_requests": pending_requests,
        "total_revenue": round(total_revenue, 2),
        "pending_payments": pending_payments,
        "available_drivers": available_drivers,
        "total_drivers": len(drivers),
        "website_visitors": 12483,  # placeholder traffic counter
        "most_rented": most_rented,
        "revenue_chart": revenue_chart,
        "booking_status_chart": booking_status_chart,
        "category_chart": category_chart,
        "activities": activities,
    }

# ---------- Activity Logs / Settings ----------
@api_router.get("/activity-logs")
async def get_activity_logs(user=Depends(get_current_user), limit: int = 100):
    return await mysql_activity_list(limit)


def _settings_default_dict() -> Dict[str, Any]:
    d = SettingsIn().model_dump()
    d["id"] = "global"
    return d


async def _effective_settings_doc() -> Dict[str, Any]:
    s = await mysql_settings_get()
    if not s:
        return {**_settings_default_dict(), "updated_at": now_iso()}
    out = {**_settings_default_dict(), **s}
    if out.get("currency") not in ("USD", "RWF"):
        out["currency"] = "USD"
    return out


async def _dispatch_notification_email(doc: Dict[str, Any]) -> None:
    settings = await _effective_settings_doc()
    await send_notification_email(settings, doc)


async def _record_notification_and_email(
    ntype: str,
    title: str,
    message: str,
    channel: str = "in_app",
    recipient_email: Optional[str] = None,
) -> None:
    doc: Dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "type": ntype,
        "title": title,
        "message": message,
        "channel": channel,
        "is_read": False,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    if recipient_email:
        doc["recipient_email"] = recipient_email.strip().lower()
    try:
        await mysql_doc_insert("notifications", doc)
    except Exception:
        logger.exception("_record_notification_and_email: insert failed")
    try:
        settings = await _effective_settings_doc()
        await send_notification_email(settings, doc)
    except Exception:
        logger.exception("_record_notification_and_email: email failed")


make_crud_routes(
    "notifications",
    "notifications",
    NotificationIn,
    on_create=_dispatch_notification_email,
)


def _normalize_public_website_origin(raw: str) -> str:
    u = (raw or "").strip().rstrip("/")
    if not u:
        return ""
    if not u.startswith("http://") and not u.startswith("https://"):
        u = f"https://{u}"
    return u


def _resolve_marketing_asset_url(doc: Dict[str, Any], raw: Optional[str], fallback_path: str) -> str:
    """Turn stored og/logo paths into absolute URLs for social crawlers."""
    candidate = str(raw or "").strip()
    if candidate.startswith("http://") or candidate.startswith("https://"):
        return candidate
    origin = _normalize_public_website_origin(str(doc.get("website_url") or ""))
    if candidate.startswith("/"):
        return f"{origin}{candidate}" if origin else candidate
    if candidate:
        if candidate.startswith("/api/files/"):
            path = candidate
        elif "/api/files/" in candidate:
            path = candidate[candidate.index("/api/files/") :]
        else:
            path = f"/api/files/{candidate.lstrip('/')}"
        return f"{origin}{path}" if origin else path
    return f"{origin}{fallback_path}" if origin else fallback_path


@api_router.get("/branding")
async def get_public_branding():
    """Public: company name / logo / contact / footer copy for marketing sites (no auth)."""
    try:
        doc = await _effective_settings_doc()

        def _s(key: str) -> str:
            return str(doc.get(key) or "").strip()

        social: Dict[str, str] = {}
        for key, doc_key in (
            ("facebook", "social_facebook_url"),
            ("twitter", "social_twitter_url"),
            ("x", "social_twitter_url"),
            ("instagram", "social_instagram_url"),
            ("linkedin", "social_linkedin_url"),
            ("youtube", "social_youtube_url"),
            ("whatsapp", "social_whatsapp_url"),
            ("tiktok", "social_tiktok_url"),
        ):
            u = _s(doc_key)
            if u and key not in social:
                social[key] = u
        legacy = doc.get("social_links")
        if isinstance(legacy, dict):
            for k2 in (
                "facebook",
                "twitter",
                "x",
                "instagram",
                "linkedin",
                "youtube",
                "whatsapp",
                "tiktok",
            ):
                v = legacy.get(k2)
                if v and str(v).strip() and k2 not in social:
                    social[k2] = str(v).strip()

        footer_tagline = _s("footer_tagline") or None
        footer_description = _s("footer_description") or None
        company_description = _s("company_description") or None
        site_title = _s("site_seo_title") or _s("company_name") or "Nova Car Rentals"
        meta_description = (
            _s("site_meta_description")
            or company_description
            or footer_description
            or "Premium car rentals across Rwanda, Uganda, and Tanzania."
        )
        robots = _s("site_robots") or "index, follow"
        twitter_card = _s("twitter_card") or "summary_large_image"
        og_image = _resolve_marketing_asset_url(
            doc,
            _s("og_image_url") or doc.get("logo_url"),
            "/opengraph.jpg",
        )
        html_lang = _s("language") or "en"
        if footer_tagline is None or footer_description is None:
            try:
                cms_items = await mysql_doc_list("cms_pages", 2000)
                about = next(
                    (
                        d
                        for d in cms_items
                        if str(d.get("key", "")).strip().lower() == "about"
                    ),
                    None,
                )
                if about and about.get("is_published"):
                    about_title = str(about.get("title") or "").strip()
                    if footer_tagline is None and about_title:
                        footer_tagline = about_title
                    if footer_description is None:
                        excerpt = _blog_plain_excerpt(
                            str(about.get("content") or ""), 320
                        )
                        if excerpt:
                            footer_description = excerpt
                        else:
                            sd = str(about.get("seo_description") or "").strip()
                            if sd:
                                footer_description = sd
            except Exception:
                logger.debug(
                    "get_public_branding: optional CMS about fallback failed",
                    exc_info=True,
                )

        return {
            "company_name": doc.get("company_name") or "NovaCar Admin",
            "logo_url": doc.get("logo_url"),
            "currency": "USD",
            "updated_at": doc.get("updated_at"),
            "footer_tagline": footer_tagline,
            "footer_description": footer_description,
            "footer_credit_line": _s("footer_credit_line") or None,
            "business_hours_text": _s("business_hours_text") or None,
            "social_links": social,
            "seo": {
                "title": site_title,
                "description": meta_description,
                "robots": robots,
                "og_type": "website",
                "og_image_url": og_image,
                "twitter_card": twitter_card,
                "language": html_lang,
            },
            "company": {
                "phone": doc.get("company_phone"),
                "email": doc.get("company_email"),
                "description": _s("company_description") or None,
                "website_url": doc.get("website_url"),
                "address_line1": doc.get("address_line1"),
                "address_line2": doc.get("address_line2"),
                "city": doc.get("city"),
                "state_region": doc.get("state_region"),
                "postal_code": doc.get("postal_code"),
                "country": doc.get("country"),
            },
        }
    except Exception:
        logger.exception("get_public_branding: mysql/settings failed — returning defaults")
        return {
            "company_name": "NovaCar Admin",
            "logo_url": None,
            "currency": "USD",
            "updated_at": None,
            "footer_tagline": None,
            "footer_description": None,
            "footer_credit_line": None,
            "business_hours_text": None,
            "social_links": {},
            "seo": {
                "title": "Nova Car Rentals",
                "description": "Premium car rentals across Rwanda, Uganda, and Tanzania.",
                "robots": "index, follow",
                "og_type": "website",
                "og_image_url": "/opengraph.jpg",
                "twitter_card": "summary_large_image",
                "language": "en",
            },
            "company": {
                "phone": None,
                "email": None,
                "description": None,
                "website_url": None,
                "address_line1": None,
                "address_line2": None,
                "city": None,
                "state_region": None,
                "postal_code": None,
                "country": None,
            },
        }


def _resolved_branding_storage_path(logo_raw: str) -> Optional[str]:
    """Return object-store path under {APP_NAME}/branding/ or None if not an internal logo."""
    logo = (logo_raw or "").strip()
    if not logo or logo.startswith("http://") or logo.startswith("https://"):
        return None
    p = logo.strip()
    if "/api/files/" in p:
        idx = p.index("/api/files/")
        p = p[idx + len("/api/files/") :]
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/branding/"
    if not p.startswith(prefix):
        return None
    return p


def _infer_public_api_base(request: Request) -> str:
    """Best-effort absolute origin for links returned to browsers (e.g. Django marketing site)."""
    xf_proto = (request.headers.get("x-forwarded-proto") or request.url.scheme or "https").split(",")[0].strip()
    xf_host = (request.headers.get("x-forwarded-host") or request.headers.get("host") or "").split(",")[0].strip()
    if xf_host:
        return f"{xf_proto}://{xf_host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def _resolved_team_photo_storage_path(raw: str) -> Optional[str]:
    """Normalize team photo_path to storage key under {APP_NAME}/team/ (no auth public serve)."""
    if not raw or ".." in raw:
        return None
    p = raw.strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        return None
    if "/api/files/" in p:
        idx = p.index("/api/files/")
        p = p[idx + len("/api/files/") :]
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/team/"
    if not p.startswith(prefix):
        return None
    return p


def _resolved_blog_cover_storage_path(raw: Optional[str]) -> Optional[str]:
    """Normalize blog cover_image to storage key under {APP_NAME}/blogs/ (public serve)."""
    if not raw or ".." in str(raw):
        return None
    p = str(raw).strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        return None
    if "/api/files/" in p:
        try:
            idx = p.index("/api/files/")
            p = p[idx + len("/api/files/") :]
        except ValueError:
            return None
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/blogs/"
    if not p.startswith(prefix):
        return None
    return p


def _resolved_testimonial_profile_storage_path(raw: Optional[str]) -> Optional[str]:
    """Normalize profile_image to storage key under {APP_NAME}/testimonials/ (public serve)."""
    if not raw or ".." in str(raw):
        return None
    p = str(raw).strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        return None
    if "/api/files/" in p:
        try:
            idx = p.index("/api/files/")
            p = p[idx + len("/api/files/") :]
        except ValueError:
            return None
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/testimonials/"
    if not p.startswith(prefix):
        return None
    return p


def _resolved_cms_about_image_storage_path(raw: Optional[str]) -> Optional[str]:
    """Normalize about collage image to storage key under {APP_NAME}/cms/about/ (public serve)."""
    if not raw or ".." in str(raw):
        return None
    p = str(raw).strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        return None
    if "/api/files/" in p:
        try:
            idx = p.index("/api/files/")
            p = p[idx + len("/api/files/") :]
        except ValueError:
            return None
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/cms/"
    if not p.startswith(prefix):
        return None
    return p


def _serialize_public_destination_countries(
    raw: Any, request: Request
) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        parks_raw = row.get("parks") if isinstance(row.get("parks"), list) else []
        parks = [
            {"name": str(p.get("name") or ""), "highlight": str(p.get("highlight") or "")}
            for p in parks_raw
            if isinstance(p, dict)
        ]
        cities_raw = row.get("cities") if isinstance(row.get("cities"), list) else []
        cities = [str(c).strip() for c in cities_raw if str(c).strip()]
        out.append(
            {
                "name": str(row.get("name") or ""),
                "tagline": str(row.get("tagline") or ""),
                "description": str(row.get("description") or ""),
                "icon": str(row.get("icon") or "mountain"),
                "cities": cities,
                "parks": parks,
                "img_bg": str(row.get("img_bg") or "bg-gradient-to-br from-green-900/30 to-background"),
                "cover_image_url": _cms_about_image_public_url(row.get("cover_image"), request),
                "display_order": int(row.get("display_order") or 0),
            }
        )
    out.sort(key=lambda c: (c.get("display_order") or 0, c.get("name") or ""))
    return out


def _serialize_public_service_items(raw: Any) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        perks_raw = row.get("perks") if isinstance(row.get("perks"), list) else []
        perks = [str(p).strip() for p in perks_raw if str(p).strip()]
        out.append(
            {
                "icon": str(row.get("icon") or "car"),
                "title": str(row.get("title") or ""),
                "tagline": str(row.get("tagline") or ""),
                "description": str(row.get("description") or ""),
                "perks": perks,
                "cta_text": str(row.get("cta_text") or "Book Now"),
                "display_order": int(row.get("display_order") or 0),
            }
        )
    out.sort(key=lambda s: (s.get("display_order") or 0, s.get("title") or ""))
    return out


def _resolved_travel_guide_cover_storage_path(raw: Optional[str]) -> Optional[str]:
    """Normalize guide cover to storage key under {APP_NAME}/guides/ (public serve)."""
    if not raw or ".." in str(raw):
        return None
    p = str(raw).strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        return None
    if "/api/files/" in p:
        try:
            idx = p.index("/api/files/")
            p = p[idx + len("/api/files/") :]
        except ValueError:
            return None
    p = p.lstrip("/")
    prefix = f"{APP_NAME}/guides/"
    if not p.startswith(prefix):
        return None
    return p


def _cms_about_image_public_url(raw: Any, request: Request) -> Optional[str]:
    if raw is None:
        return None
    cr = str(raw).strip()
    if not cr:
        return None
    if cr.startswith("http://") or cr.startswith("https://"):
        return cr
    sp = _resolved_cms_about_image_storage_path(cr)
    if not sp:
        return None
    base = _infer_public_api_base(request)
    return f"{base}/api/public/cms-asset?path={quote(sp, safe='')}"


def _travel_guide_cover_public_url(raw: Any, request: Request) -> Optional[str]:
    if raw is None:
        return None
    cr = str(raw).strip()
    if not cr:
        return None
    if cr.startswith("http://") or cr.startswith("https://"):
        return cr
    sp = _resolved_travel_guide_cover_storage_path(cr)
    if not sp:
        return None
    base = _infer_public_api_base(request)
    return f"{base}/api/public/guide-asset?path={quote(sp, safe='')}"


def _blog_plain_excerpt(content: Optional[str], limit: int = 240) -> str:
    t = re.sub(r"<[^>]+>", " ", content or "")
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) <= limit:
        return t
    if limit <= 1:
        return t[:limit]
    return t[: limit - 1].rstrip() + "…"


def _blog_cover_public_url(raw: Any, request: Request) -> Optional[str]:
    if raw is None:
        return None
    cr = str(raw).strip()
    if not cr:
        return None
    if cr.startswith("http://") or cr.startswith("https://"):
        return cr
    sp = _resolved_blog_cover_storage_path(cr)
    if not sp:
        return None
    base = _infer_public_api_base(request)
    return f"{base}/api/public/blog-asset?path={quote(sp, safe='')}"


@api_router.get("/public/branding-asset")
async def public_branding_asset(
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve uploaded company logo without auth (path allowlist: carrental/branding/*). External URLs redirect."""
    doc = await _effective_settings_doc()
    logo = (doc.get("logo_url") or "").strip()
    if not logo:
        raise HTTPException(status_code=404, detail="No logo configured")
    if logo.startswith("http://") or logo.startswith("https://"):
        return RedirectResponse(url=logo, status_code=302)
    path = _resolved_branding_storage_path(logo)
    if not path:
        raise HTTPException(status_code=404, detail="Invalid logo path")
    record = await mysql_file_find_by_path(path)
    if not record:
        raise HTTPException(status_code=404, detail="Logo file not found")
    data, ct = fetch_file_bytes(path)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=path, width=w
    )


@api_router.get("/public/team-asset")
async def public_team_asset(
    path: str = Query(..., min_length=3, max_length=512, description="Storage path under carrental/team/"),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve team member photos without auth (allowlist: carrental/team/* only)."""
    storage = _resolved_team_photo_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid team image path")
    record = await mysql_file_find_by_path(storage)
    if not record:
        raise HTTPException(status_code=404, detail="Team image not found")
    data, ct = fetch_file_bytes(storage)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
    )


@api_router.get("/public/blog-asset")
async def public_blog_asset(
    path: str = Query(..., min_length=10, max_length=512, description="Storage path under carrental/blogs/"),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve blog cover images without auth (allowlist: carrental/blogs/* only)."""
    storage = _resolved_blog_cover_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid blog image path")
    record = await mysql_file_find_by_path(storage)
    if not record:
        raise HTTPException(status_code=404, detail="Blog image not found")
    data, ct = fetch_file_bytes(storage)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
    )


@api_router.get("/public/testimonial-asset")
async def public_testimonial_asset(
    path: str = Query(..., min_length=10, max_length=512, description="Storage path under carrental/testimonials/"),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve testimonial profile images without auth (allowlist: carrental/testimonials/* only)."""
    storage = _resolved_testimonial_profile_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid testimonial image path")
    record = await mysql_file_find_by_path(storage)
    if not record:
        raise HTTPException(status_code=404, detail="Testimonial image not found")
    data, ct = fetch_file_bytes(storage)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
    )


@api_router.get("/public/cms-asset")
async def public_cms_asset(
    path: str = Query(..., min_length=10, max_length=512, description="Storage path under carrental/cms/"),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve CMS page images without auth (allowlist: carrental/cms/* only)."""
    storage = _resolved_cms_about_image_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid CMS image path")
    record = await mysql_file_find_by_path(storage)
    if not record:
        raise HTTPException(status_code=404, detail="CMS image not found")
    data, ct = fetch_file_bytes(storage)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
    )


@api_router.get("/public/guide-asset")
async def public_guide_asset(
    path: str = Query(..., min_length=10, max_length=512, description="Storage path under carrental/guides/"),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve travel guide cover images without auth (allowlist: carrental/guides/* only)."""
    storage = _resolved_travel_guide_cover_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid guide image path")
    record = await mysql_file_find_by_path(storage)
    if not record:
        raise HTTPException(status_code=404, detail="Guide image not found")
    data, ct = fetch_file_bytes(storage)
    return _public_image_response(
        data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
    )


@api_router.get("/public/cms-page/{page_key}")
async def get_public_cms_page(page_key: str, request: Request):
    """
    Public (no auth): published CMS page body for the marketing site / browser.
    Draft or missing pages return published=false without exposing draft HTML.
    """
    key = re.sub(r"[^a-z0-9_-]", "", (page_key or "").lower())[:80]
    if not key:
        raise HTTPException(status_code=400, detail="Invalid page key")
    empty = {
        "key": key,
        "published": False,
        "title": None,
        "content": None,
        "seo_title": None,
        "seo_description": None,
        "updated_at": None,
    }
    try:
        items = await mysql_doc_list("cms_pages", 2000)
    except Exception:
        logger.exception("get_public_cms_page: list cms_pages failed")
        return empty
    match = next((d for d in items if str(d.get("key", "")).strip().lower() == key), None)
    if not match:
        return empty
    if not match.get("is_published"):
        return {**empty, "updated_at": match.get("updated_at")}
    return {
        "key": key,
        "published": True,
        "title": match.get("title"),
        "content": match.get("content"),
        "seo_title": match.get("seo_title"),
        "seo_description": match.get("seo_description"),
        "updated_at": match.get("updated_at"),
        "hero_eyebrow": match.get("hero_eyebrow"),
        "hero_image_url": _cms_about_image_public_url(match.get("hero_image"), request),
        "story_title": match.get("story_title"),
        "story_content": match.get("story_content"),
        "stats": match.get("stats"),
        "values": match.get("values"),
        "promises": match.get("promises"),
        "cta_title": match.get("cta_title"),
        "cta_description": match.get("cta_description"),
        "story_image_rw_url": _cms_about_image_public_url(match.get("story_image_rw"), request),
        "story_image_ug_url": _cms_about_image_public_url(match.get("story_image_ug"), request),
        "story_image_tz_url": _cms_about_image_public_url(match.get("story_image_tz"), request),
        "story_quote": match.get("story_quote"),
        "destination_countries": _serialize_public_destination_countries(
            match.get("destination_countries"), request
        ),
        "airports_eyebrow": match.get("airports_eyebrow"),
        "airports_title": match.get("airports_title"),
        "airports_intro": match.get("airports_intro"),
        "destination_airports": match.get("destination_airports") or [],
        "cross_border_eyebrow": match.get("cross_border_eyebrow"),
        "cross_border_title": match.get("cross_border_title"),
        "cross_border_description": match.get("cross_border_description"),
        "cross_border_button": match.get("cross_border_button"),
        "service_items": _serialize_public_service_items(match.get("service_items")),
        "perfect_for_eyebrow": match.get("perfect_for_eyebrow"),
        "perfect_for_title": match.get("perfect_for_title"),
        "perfect_for_items": match.get("perfect_for_items") or [],
        "bottom_cta_title": match.get("bottom_cta_title"),
        "bottom_cta_description": match.get("bottom_cta_description"),
        "bottom_cta_button": match.get("bottom_cta_button"),
    }


def _public_site_origin(doc: Optional[Dict[str, Any]] = None) -> str:
    s = doc or {}
    raw = (os.environ.get("PUBLIC_WEBSITE_URL") or s.get("website_url") or "").strip()
    if not raw:
        smtp_user = (os.environ.get("SMTP_USER") or s.get("smtp_user") or "").strip()
        if "@" in smtp_user:
            domain = smtp_user.split("@", 1)[1]
            if domain and "." in domain:
                raw = f"https://{domain}"
    u = raw.rstrip("/")
    if u and not u.startswith("http://") and not u.startswith("https://"):
        u = f"https://{u}"
    return u


def _sitemap_url_block(
    origin: str,
    path: str,
    lastmod: Optional[str] = None,
    changefreq: str = "weekly",
    priority: str = "0.7",
) -> str:
    loc = f"{origin}{path if path.startswith('/') else '/' + path}"
    lastmod_tag = f"\n    <lastmod>{lastmod[:10]}</lastmod>" if lastmod else ""
    return f"""  <url>
    <loc>{loc}</loc>{lastmod_tag}
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""


@api_router.get("/public/sitemap.xml")
async def public_sitemap_xml():
    """Public XML sitemap for search engines (static routes + fleet, guides, blogs)."""
    try:
        settings = await _effective_settings_doc()
        origin = _public_site_origin(settings) or "https://novacarrentals.com"

        static_paths = [
            ("/", "daily", "1.0"),
            ("/fleet", "weekly", "0.9"),
            ("/services", "weekly", "0.8"),
            ("/destinations", "weekly", "0.8"),
            ("/about", "monthly", "0.7"),
            ("/contact", "monthly", "0.7"),
            ("/guides", "weekly", "0.8"),
            ("/blogs", "weekly", "0.8"),
        ]
        blocks: List[str] = []
        for path, freq, pri in static_paths:
            blocks.append(_sitemap_url_block(origin, path, changefreq=freq, priority=pri))

        vehicles = await mysql_doc_list("vehicles", 5000)
        for v in vehicles:
            st = str(v.get("status") or "").lower()
            if st in ("maintenance", "out_of_service"):
                continue
            vid = str(v.get("id") or "").strip()
            if not vid:
                continue
            lm = str(v.get("updated_at") or v.get("created_at") or "")
            blocks.append(
                _sitemap_url_block(origin, f"/fleet/{vid}", lastmod=lm or None, changefreq="weekly", priority="0.8")
            )

        guides = await mysql_doc_list("travel_guides", 5000)
        for g in guides:
            if g.get("is_published") is False:
                continue
            slug = str(g.get("slug") or "").strip()
            if not slug:
                continue
            lm = str(g.get("updated_at") or g.get("created_at") or "")
            blocks.append(
                _sitemap_url_block(origin, f"/guides/{slug}", lastmod=lm or None, changefreq="monthly", priority="0.7")
            )

        blogs = await mysql_doc_list("blogs", 5000)
        for b in blogs:
            if not b.get("is_published"):
                continue
            slug = str(b.get("slug") or "").strip()
            if not slug:
                continue
            lm = str(b.get("updated_at") or b.get("created_at") or "")
            blocks.append(
                _sitemap_url_block(origin, f"/blogs/{slug}", lastmod=lm or None, changefreq="monthly", priority="0.6")
            )

        body = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(blocks)
            + "\n</urlset>"
        )
        return Response(content=body, media_type="application/xml")
    except Exception:
        logger.exception("public_sitemap_xml: failed")
        raise HTTPException(status_code=500, detail="Could not generate sitemap") from None


@api_router.get("/public/robots.txt")
async def public_robots_txt():
    """Public robots.txt with sitemap URL from site settings."""
    try:
        settings = await _effective_settings_doc()
        origin = _public_site_origin(settings) or "https://novacarrentals.com"
        sitemap = f"{origin}/api/public/sitemap.xml"
        body = f"User-agent: *\nAllow: /\n\nSitemap: {sitemap}\n"
        return Response(content=body, media_type="text/plain; charset=utf-8")
    except Exception:
        logger.exception("public_robots_txt: failed")
        return Response(content="User-agent: *\nAllow: /\n", media_type="text/plain; charset=utf-8")


@api_router.get("/public/cms-pages-seo")
async def get_public_cms_pages_seo():
    """Public (no auth): SEO fields for all published CMS pages (marketing site route meta)."""
    try:
        items = await mysql_doc_list("cms_pages", 2000)
    except Exception:
        logger.exception("get_public_cms_pages_seo: list cms_pages failed")
        return {}
    out: Dict[str, Dict[str, Any]] = {}
    for row in items:
        if not row.get("is_published"):
            continue
        key = str(row.get("key", "")).strip().lower()
        if not key:
            continue
        out[key] = {
            "title": row.get("title"),
            "seo_title": row.get("seo_title"),
            "seo_description": row.get("seo_description"),
        }
    return out


async def _list_public_service_cards(limit: int) -> List[Dict[str, Any]]:
    """Shared payload for public service cards (marketing /service page)."""
    try:
        items = await mysql_doc_list("marketing_services", limit)
    except Exception:
        logger.exception("list_public_service_cards: list marketing_services failed")
        return []
    published = [i for i in items if i.get("is_published") is not False]
    published.sort(
        key=lambda x: (int(x.get("display_order") or 0), (str(x.get("title") or "")).lower()),
    )
    out: List[Dict[str, Any]] = []
    for row in published:
        title = (str(row.get("title") or "")).strip()
        body = (str(row.get("body") or "")).strip()
        if not title and not body:
            continue
        out.append(
            {
                "id": row.get("id"),
                "title": title or "Service",
                "body": body,
            }
        )
    return out


@api_router.get("/public/service-cards")
async def get_public_service_cards(limit: int = Query(100, ge=1, le=500)):
    """Public (no auth): published service cards for the marketing /service page (canonical path)."""
    return await _list_public_service_cards(limit)


@api_router.get("/public/marketing-services")
async def get_public_marketing_services(limit: int = Query(100, ge=1, le=500)):
    """Backward-compatible alias for older frontends (same as /public/service-cards)."""
    return await _list_public_service_cards(limit)


@api_router.get("/public/team")
async def get_public_team(request: Request, limit: int = Query(100, ge=1, le=500)):
    """Public (no auth): visible team members for marketing sites (Django client, etc.)."""
    try:
        items = await mysql_doc_list("team_members", limit)
    except Exception:
        logger.exception("get_public_team: list team_members failed")
        return []
    visible = [i for i in items if i.get("is_visible") is not False]
    visible.sort(
        key=lambda x: (int(x.get("display_order") or 0), (str(x.get("full_name") or "")).lower())
    )
    base = _infer_public_api_base(request)
    out: List[Dict[str, Any]] = []
    for m in visible:
        ph = (m.get("photo_path") or "").strip()
        if ph.startswith(("http://", "https://")):
            photo_url = ph
        else:
            sp = _resolved_team_photo_storage_path(ph)
            photo_url = f"{base}/api/public/team-asset?path={quote(sp, safe='')}" if sp else None
        out.append(
            {
                "full_name": m.get("full_name"),
                "role": m.get("role"),
                "bio": m.get("bio") or "",
                "email": (m.get("email") or "").strip() or None,
                "phone": (m.get("phone") or "").strip() or None,
                "display_order": int(m.get("display_order") or 0),
                "photo_url": photo_url,
            }
        )
    return out


@api_router.get("/public/testimonials")
async def get_public_testimonials(request: Request, limit: int = Query(100, ge=1, le=500)):
    """Public (no auth): visible testimonials for marketing home / landing pages."""
    try:
        items = await mysql_doc_list("testimonials", limit)
    except Exception:
        logger.exception("get_public_testimonials: list testimonials failed")
        return []
    visible = [i for i in items if _doc_is_visible(i)]
    visible.sort(
        key=lambda x: (int(x.get("display_order") or 0), str(x.get("created_at") or "")),
        reverse=False,
    )
    base = _infer_public_api_base(request)
    out: List[Dict[str, Any]] = []
    for t in visible:
        img = (t.get("profile_image") or "").strip()
        if img.startswith(("http://", "https://")):
            profile_image_url = img
        else:
            sp = _resolved_testimonial_profile_storage_path(img)
            profile_image_url = (
                f"{base}/api/public/testimonial-asset?path={quote(sp, safe='')}" if sp else None
            )
        try:
            rating = int(t.get("rating") or 5)
        except (TypeError, ValueError):
            rating = 5
        rating = max(1, min(5, rating))
        out.append(
            {
                "id": t.get("id"),
                "name": t.get("name"),
                "role": str(t.get("role") or "").strip(),
                "testimonial": t.get("testimonial") or "",
                "rating": rating,
                "display_order": int(t.get("display_order") or 0),
                "profile_image_url": profile_image_url,
            }
        )
    return out[:limit]


@api_router.get("/public/blogs")
async def get_public_blogs(request: Request, limit: int = Query(50, ge=1, le=100)):
    """Public (no auth): published blog posts for marketing sites."""
    try:
        items = await mysql_doc_list("blogs", 2000)
    except Exception:
        logger.exception("get_public_blogs: list blogs failed")
        return []
    published = [b for b in items if b.get("is_published") is True]
    published.sort(
        key=lambda x: str(x.get("updated_at") or x.get("created_at") or ""),
        reverse=True,
    )
    out: List[Dict[str, Any]] = []
    for b in published[:limit]:
        out.append(
            {
                "id": b.get("id"),
                "title": b.get("title"),
                "slug": b.get("slug"),
                "category": b.get("category") or "General",
                "tags": b.get("tags") or [],
                "excerpt": _blog_plain_excerpt(b.get("content"), 240),
                "author": b.get("author") or "Editor",
                "cover_image_url": _blog_cover_public_url(b.get("cover_image"), request),
                "created_at": b.get("created_at"),
                "updated_at": b.get("updated_at"),
            }
        )
    return out


@api_router.get("/public/blogs/{slug}")
async def get_public_blog_by_slug(request: Request, slug: str):
    """Public (no auth): one published post by URL slug."""
    key = re.sub(r"[^a-z0-9-]", "", (slug or "").lower())[:160]
    if not key:
        raise HTTPException(status_code=400, detail="Invalid slug")
    try:
        items = await mysql_doc_list("blogs", 2000)
    except Exception:
        logger.exception("get_public_blog_by_slug: list blogs failed")
        raise HTTPException(status_code=503, detail="Blog service unavailable") from None
    match = next(
        (
            d
            for d in items
            if d.get("is_published") is True and str(d.get("slug") or "").strip().lower() == key
        ),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": match.get("id"),
        "title": match.get("title"),
        "slug": match.get("slug"),
        "category": match.get("category") or "General",
        "tags": match.get("tags") or [],
        "content": match.get("content") or "",
        "seo_title": match.get("seo_title"),
        "seo_description": match.get("seo_description"),
        "author": match.get("author") or "Editor",
        "cover_image_url": _blog_cover_public_url(match.get("cover_image"), request),
        "created_at": match.get("created_at"),
        "updated_at": match.get("updated_at"),
    }


def _doc_is_published(doc: Dict[str, Any]) -> bool:
    """True when a CMS/travel doc should appear on the public marketing site."""
    v = doc.get("is_published")
    if v is True or v == 1:
        return True
    if v is False or v == 0 or v is None:
        return False
    if isinstance(v, str):
        return v.strip().lower() in ("true", "1", "yes", "on")
    return bool(v)


def _doc_is_visible(doc: Dict[str, Any]) -> bool:
    """True when a marketing record should appear on the public site (testimonials, team, etc.)."""
    v = doc.get("is_visible")
    if v is True or v == 1:
        return True
    if v is False or v == 0 or v is None:
        return False
    if isinstance(v, str):
        return v.strip().lower() in ("true", "1", "yes", "on")
    return bool(v)


def _normalize_guide_slug(raw: Any) -> str:
    return re.sub(r"[^a-z0-9-]", "", str(raw or "").strip().lower())[:160]


def _public_travel_guide_sections(raw: Any, request: Request) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        heading = str(row.get("heading") or "").strip()
        body = str(row.get("body") or "").strip()
        image_raw = str(row.get("image") or "").strip()
        if not heading and not body and not image_raw:
            continue
        tip = str(row.get("tip") or "").strip() or None
        out.append(
            {
                "heading": heading,
                "body": body,
                "tip": tip,
                "image_url": _travel_guide_cover_public_url(image_raw, request) if image_raw else None,
            }
        )
    return out


def _public_travel_guide_gallery(raw: Any, request: Request) -> List[str]:
    if not isinstance(raw, list):
        return []
    out: List[str] = []
    for item in raw:
        url = _travel_guide_cover_public_url(item, request)
        if url:
            out.append(url)
    return out


def _public_travel_guide_vehicles(raw: Any, fleet_by_id: Optional[Dict[str, Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        vid = str(row.get("id") or "").strip()
        name = str(row.get("name") or "").strip()
        reason = str(row.get("reason") or "").strip()
        fleet_row = fleet_by_id.get(vid) if fleet_by_id and vid else None
        if fleet_row and not name:
            name = str(fleet_row.get("name") or "").strip()
        if not name and not vid:
            continue
        entry: Dict[str, Any] = {"id": vid, "name": name, "reason": reason}
        if fleet_row is not None and fleet_row.get("daily_rate") is not None:
            try:
                entry["daily_rate"] = float(fleet_row.get("daily_rate"))
            except (TypeError, ValueError):
                pass
        out.append(entry)
    return out


def _public_travel_guide_info(raw: Any) -> List[Dict[str, str]]:
    if not isinstance(raw, list):
        return []
    out: List[Dict[str, str]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        label = str(row.get("label") or "").strip()
        value = str(row.get("value") or "").strip()
        if not label and not value:
            continue
        out.append({"label": label, "value": value})
    return out


def _serialize_public_travel_guide(
    doc: Dict[str, Any],
    request: Request,
    *,
    summary: bool,
    fleet_by_id: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    base = {
        "id": doc.get("id"),
        "slug": _normalize_guide_slug(doc.get("slug")) or str(doc.get("slug") or "").strip(),
        "title": doc.get("title"),
        "subtitle": doc.get("subtitle") or "",
        "category": doc.get("category") or "Road Trip",
        "country": doc.get("country") or "",
        "flag": doc.get("flag") or "",
        "read_time": doc.get("read_time") or "5 min read",
        "cover_gradient": doc.get("cover_gradient") or "from-emerald-950 via-green-900 to-emerald-800",
        "cover_image_url": _travel_guide_cover_public_url(doc.get("cover_image"), request),
        "card_image_url": _travel_guide_cover_public_url(doc.get("card_image"), request)
        or _travel_guide_cover_public_url(doc.get("cover_image"), request),
        "accent_color": doc.get("accent_color") or "text-emerald-400",
        "tags": doc.get("tags") if isinstance(doc.get("tags"), list) else [],
        "intro": doc.get("intro") or "",
        "best_months": doc.get("best_months") or "",
        "difficulty": doc.get("difficulty") or "Moderate",
        "display_order": int(doc.get("display_order") or 0),
        "updated_at": doc.get("updated_at"),
    }
    if summary:
        return base
    return {
        **base,
        "gallery_image_urls": _public_travel_guide_gallery(doc.get("gallery_images"), request),
        "sections": _public_travel_guide_sections(doc.get("sections"), request),
        "recommended_vehicles": _public_travel_guide_vehicles(doc.get("recommended_vehicles"), fleet_by_id),
        "practical_info": _public_travel_guide_info(doc.get("practical_info")),
        "cta_text": doc.get("cta_text") or "Book your vehicle for this journey",
        "seo_title": doc.get("seo_title"),
        "seo_description": doc.get("seo_description"),
    }


@api_router.get("/public/travel-guides")
async def get_public_travel_guides(request: Request, limit: int = Query(50, ge=1, le=100)):
    """Public (no auth): published travel guides for the marketing /guides page."""
    try:
        items = await mysql_doc_list("travel_guides", 2000)
    except Exception:
        logger.exception("get_public_travel_guides: list failed")
        return []
    published = [g for g in items if _doc_is_published(g)]
    published.sort(
        key=lambda x: (int(x.get("display_order") or 0), str(x.get("updated_at") or "")),
        reverse=False,
    )
    return [_serialize_public_travel_guide(g, request, summary=True) for g in published[:limit]]


@api_router.get("/public/travel-guides/{slug}")
async def get_public_travel_guide_by_slug(request: Request, slug: str):
    """Public (no auth): one published travel guide by URL slug."""
    key = _normalize_guide_slug(slug)
    if not key:
        raise HTTPException(status_code=400, detail="Invalid slug")
    try:
        items = await mysql_doc_list("travel_guides", 2000)
    except Exception:
        logger.exception("get_public_travel_guide_by_slug: list failed")
        raise HTTPException(status_code=503, detail="Guide service unavailable") from None
    match = next(
        (
            d
            for d in items
            if _doc_is_published(d) and _normalize_guide_slug(d.get("slug")) == key
        ),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail="Guide not found")
    fleet_by_id: Dict[str, Dict[str, Any]] = {}
    try:
        fleet_rows = await mysql_doc_list("vehicles", 5000)
        fleet_by_id = {str(v.get("id")): v for v in fleet_rows if v.get("id")}
    except Exception:
        logger.debug("get_public_travel_guide_by_slug: fleet lookup for recommendations failed", exc_info=True)
    return _serialize_public_travel_guide(match, request, summary=False, fleet_by_id=fleet_by_id)


# Public vehicle images: allow any safe app slug before /vehicles/ (matches rows in `vehicles.document` JSON).
_VEHICLE_PUBLIC_STORAGE_RE = re.compile(r"^[a-z0-9_-]+/vehicles/.+", re.IGNORECASE)


def _resolved_vehicle_public_storage_path(raw: str) -> Optional[str]:
    """Normalize vehicle image ref to a storage key `{slug}/vehicles/...` (public serve allowlist)."""
    if not raw or ".." in raw:
        return None
    p = str(raw).strip().replace("\\", "/")
    if p.startswith("http://") or p.startswith("https://"):
        if "/api/files/" not in p:
            return None
        try:
            path = urlparse(p).path or ""
        except Exception:
            return None
        if "/api/files/" in path:
            idx = path.index("/api/files/")
            p = path[idx + len("/api/files/") :]
        else:
            return None
    else:
        low = p.lower()
        marker = "api/files/"
        if marker in low:
            idx = low.index(marker)
            p = p[idx + len(marker) :].lstrip("/")
    p = p.lstrip("/")
    if not _VEHICLE_PUBLIC_STORAGE_RE.match(p):
        return None
    return p


def _storage_image_is_servable(storage_path: str) -> bool:
    """True when public vehicle-asset can return bytes (local copy or object storage configured)."""
    if try_read_local_upload(storage_path):
        return True
    # Avoid emitting dead URLs that 404 in the browser when Emergent storage is unset.
    return bool((os.environ.get("EMERGENT_LLM_KEY") or "").strip())


def _resolve_single_vehicle_image_url(raw: Any, base: str) -> Optional[str]:
    """Turn stored vehicle image (http URL, /api/files URL, or storage path) into a browser-safe URL."""
    rs = str(raw or "").strip()
    if not rs:
        return None
    if rs.startswith(("http://", "https://")):
        inner = _resolved_vehicle_public_storage_path(rs)
        if inner:
            if not _storage_image_is_servable(inner):
                return None
            return f"{base}/api/public/vehicle-asset?path={quote(inner, safe='')}"
        # External CDN / absolute image URL — leave as-is for the browser.
        return rs
    sp = _resolved_vehicle_public_storage_path(rs)
    if not sp:
        return None
    if not _storage_image_is_servable(sp):
        return None
    return f"{base}/api/public/vehicle-asset?path={quote(sp, safe='')}"


def _coerce_vehicle_image_ref(raw: Any) -> str:
    """Turn a JSON document value (string, dict with url/path, number) into a single ref string."""
    if raw is None:
        return ""
    if isinstance(raw, str):
        t = raw.strip()
        return "" if t == "[object Object]" else t
    if isinstance(raw, bool):
        return ""
    if isinstance(raw, (int, float)):
        t = str(raw).strip()
        return t
    if isinstance(raw, dict):
        o = raw
        for k in (
            "url",
            "href",
            "path",
            "src",
            "file_path",
            "storage_path",
            "image",
            "file",
        ):
            u = o.get(k)
            if u is not None and str(u).strip():
                return str(u).strip()
        return ""
    t = str(raw).strip()
    return "" if not t or t == "[object Object]" else t


def _vehicle_ordered_image_raw_slots(v: Dict[str, Any]) -> List[Tuple[str, str]]:
    """(label, raw_ref) in display order, deduped by raw string.

    Reads the same fields as the admin UI plus common alternates stored only in `vehicles.document` JSON
    (e.g. `images` / `photos` arrays, dict-shaped gallery items, `main_image`, etc.).
    """
    seen_raw: Set[str] = set()
    out: List[Tuple[str, str]] = []

    def add(label: str, raw: Any) -> None:
        s = _coerce_vehicle_image_ref(raw)
        if not s or s in seen_raw:
            return
        seen_raw.add(s)
        out.append((label, s))

    for label, key in (
        ("Hero", "image_url"),
        ("Hero", "main_image"),
        ("Hero", "cover_image"),
        ("Hero", "thumbnail"),
        ("Hero", "photo"),
        ("Front", "image_front"),
        ("Back", "image_back"),
        ("Side", "image_side"),
        ("Interior", "image_interior"),
    ):
        add(label, v.get(key))

    for list_key, label in (
        ("gallery_images", "Gallery"),
        ("images", "Gallery"),
        ("photos", "Gallery"),
        ("media", "Gallery"),
        ("pictures", "Gallery"),
        ("vehicle_images", "Gallery"),
    ):
        raw_list = v.get(list_key)
        if isinstance(raw_list, list):
            for g in raw_list:
                add(label, g)
        elif isinstance(raw_list, dict):
            for g in raw_list.values():
                add(label, g)

    mk = v.get("marketing")
    if isinstance(mk, dict):
        for label, key in (
            ("Hero", "image_url"),
            ("Hero", "hero_image"),
            ("Front", "image_front"),
        ):
            add(label, mk.get(key))
        gl = mk.get("gallery_images") or mk.get("images")
        if isinstance(gl, list):
            for g in gl:
                add("Gallery", g)

    return out


def _public_vehicle_image_slots(v: Dict[str, Any], request: Request) -> List[Dict[str, str]]:
    """Resolved {label, url} for marketing UIs (deduped by final URL)."""
    base = _infer_public_api_base(request)
    seen_url: Set[str] = set()
    slots: List[Dict[str, str]] = []
    for label, raw in _vehicle_ordered_image_raw_slots(v):
        u = _resolve_single_vehicle_image_url(raw, base)
        if not u or u in seen_url:
            continue
        seen_url.add(u)
        slots.append({"label": label, "url": u})
    return slots


def _public_vehicle_browser_image_urls(v: Dict[str, Any], request: Request) -> List[str]:
    return [s["url"] for s in _public_vehicle_image_slots(v, request)]


@api_router.get("/public/vehicle-asset")
async def public_vehicle_asset(
    path: str = Query(
        ...,
        min_length=8,
        max_length=512,
        description="Storage path like {app}/vehicles/... (must match public allowlist).",
    ),
    w: Optional[int] = Query(None, ge=100, le=1920, description="Max image width for compressed delivery"),
):
    """Serve vehicle marketing images without auth (allowlist: `{slug}/vehicles/*` storage keys)."""
    storage = _resolved_vehicle_public_storage_path(path)
    if not storage:
        raise HTTPException(status_code=404, detail="Invalid vehicle image path")
    record = await mysql_file_find_by_path(storage)
    if record:
        data, ct = fetch_file_bytes(storage)
        return _public_image_response(
            data, record.get("content_type", ct or "application/octet-stream"), storage_path=storage, width=w
        )
    # File may exist on disk (or object storage) even if the `files` row is missing — still allowlisted.
    try:
        data, ct = fetch_file_bytes(storage)
    except Exception:
        logger.exception("public_vehicle_asset: fetch_file_bytes failed path=%s", storage)
        raise HTTPException(status_code=404, detail="Vehicle image not found") from None
    if not data:
        raise HTTPException(status_code=404, detail="Vehicle image not found")
    mt = (ct or "").strip() or "application/octet-stream"
    if mt == "application/octet-stream" and "." in storage:
        ext = storage.rsplit(".", 1)[-1].lower()
        mt = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "gif": "image/gif",
        }.get(ext, mt)
    return _public_image_response(data, mt, storage_path=storage, width=w)


def _branch_display_map(br_list: List[Dict[str, Any]]) -> Dict[str, str]:
    """Map branch id → short label for marketing (city – name)."""
    m: Dict[str, str] = {}
    for b in br_list or []:
        bid = str(b.get("id") or "").strip()
        if not bid:
            continue
        c = str(b.get("city") or "").strip()
        n = str(b.get("name") or "").strip()
        if c and n:
            m[bid] = f"{c} – {n}"
        elif n:
            m[bid] = n
        elif c:
            m[bid] = c
    return m


@api_router.get("/public/branches")
async def get_public_branches(limit: int = Query(100, ge=1, le=500)):
    """Public (no auth): office / branch list for marketing pickup locations and contact pages."""
    try:
        items = await mysql_doc_list("branches", limit)
        out: List[Dict[str, Any]] = []
        for b in items:
            out.append(
                {
                    "id": b.get("id"),
                    "name": b.get("name"),
                    "city": b.get("city"),
                    "address": b.get("address"),
                    "manager": b.get("manager"),
                    "phone": (str(b.get("phone") or "").strip() or None),
                    "email": (str(b.get("email") or "").strip() or None),
                    "is_pickup": b.get("is_pickup") is not False,
                    "is_return": b.get("is_return") is not False,
                    "lat": b.get("lat"),
                    "lng": b.get("lng"),
                }
            )
        out.sort(
            key=lambda x: (
                str(x.get("city") or "").lower(),
                str(x.get("name") or "").lower(),
            )
        )
        return out[:limit]
    except Exception:
        logger.exception("get_public_branches: failed")
        return []


@api_router.get("/public/vehicle-categories")
async def get_public_vehicle_categories(limit: int = Query(100, ge=1, le=500)):
    """Public (no auth): active vehicle categories for fleet filters and forms."""
    try:
        items = await mysql_doc_list("vehicle_categories", limit)
        out: List[Dict[str, Any]] = []
        for row in items:
            if row.get("is_active") is False:
                continue
            name = str(row.get("name") or "").strip()
            if not name:
                continue
            out.append(
                {
                    "id": row.get("id"),
                    "name": name,
                    "description": (str(row.get("description") or "").strip() or None),
                    "display_order": int(row.get("display_order") or 0),
                }
            )
        out.sort(key=lambda x: (x["display_order"], x["name"].lower()))
        return out[:limit]
    except Exception:
        logger.exception("get_public_vehicle_categories: failed")
        return []


@api_router.post("/public/contact", status_code=201)
async def public_contact_submit(payload: ContactMessageIn):
    """Public (no auth): store a marketing-site contact form message for the admin inbox."""
    try:
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["name"] = str(doc.get("name") or "").strip()
        doc["email"] = str(doc.get("email") or "").strip().lower()
        doc["subject"] = str(doc.get("subject") or "").strip()
        doc["message"] = str(doc.get("message") or "").strip()
        doc["created_at"] = now_iso()
        doc["updated_at"] = now_iso()
        await mysql_doc_insert("contact_messages", doc)
    except Exception:
        logger.exception("public_contact_submit: insert failed")
        raise HTTPException(
            status_code=500,
            detail="Could not save your message. Please try again later.",
        ) from None
    try:
        settings = await _effective_settings_doc()
        await send_contact_admin_email(settings, doc)
        await _record_notification_and_email(
            "system",
            f"Contact: {doc.get('subject') or 'New message'}",
            f"{doc.get('name')} ({doc.get('email')}): {doc.get('message', '')[:500]}",
        )
    except Exception:
        logger.exception("public_contact_submit: email notification failed")
    return {"ok": True, "id": doc["id"]}


def _parse_public_booking_calendar_date(raw: str) -> date:
    t = (raw or "").strip()
    if not t:
        raise ValueError("empty date")
    if "T" in t:
        t = t.split("T", 1)[0]
    t = t[:10]
    return datetime.strptime(t, "%Y-%m-%d").date()


async def _public_find_or_create_customer_id(full_name: str, email: str, phone: str) -> str:
    em = email.strip().lower()
    rows = await mysql_doc_list("customers", 5000)
    for c in rows:
        if str(c.get("email") or "").strip().lower() == em:
            return str(c.get("id") or "")
    cid = str(uuid.uuid4())
    ts = now_iso()
    doc: Dict[str, Any] = {
        "id": cid,
        "full_name": full_name.strip(),
        "email": em,
        "phone": phone.strip(),
        "license_number": None,
        "address": None,
        "city": None,
        "country": None,
        "emergency_contact": None,
        "is_blacklisted": False,
        "loyalty_points": 0,
        "wallet_balance": 0.0,
        "created_at": ts,
        "updated_at": ts,
    }
    await mysql_doc_insert("customers", doc)
    return cid


@api_router.post("/public/bookings", status_code=201)
async def public_create_booking(payload: PublicBookingIn):
    """Public (no auth): create a pending booking from marketing vehicle detail. Total = inclusive calendar days × daily rate."""
    v = await mysql_doc_find_one("vehicles", str(payload.vehicle_id).strip())
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    st = (v.get("status") or "").strip()
    if st == "out_of_service":
        raise HTTPException(status_code=404, detail="Vehicle not available")

    try:
        d_pick = _parse_public_booking_calendar_date(payload.pickup_date)
        d_ret = _parse_public_booking_calendar_date(payload.return_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid pickup_date or return_date (use YYYY-MM-DD).",
        ) from None

    if d_ret < d_pick:
        raise HTTPException(
            status_code=400,
            detail="Return date must be on or after pickup date.",
        )

    # Inclusive calendar days (pickup and return dates both count).
    rental_days = max(1, (d_ret - d_pick).days + 1)

    daily = float(v.get("daily_rate") or 0)
    if daily <= 0:
        raise HTTPException(
            status_code=400,
            detail="This vehicle has no valid daily rate; contact us to book.",
        )

    total_amount = round(daily * float(rental_days), 2)

    br_list: List[Dict[str, Any]] = []
    try:
        br_list = await mysql_doc_list("branches", 500)
    except Exception:
        logger.exception("public_create_booking: branches list failed")
    bmap = _branch_display_map(br_list)

    pid = str(payload.pickup_branch_id or "").strip() or None
    rid = str(payload.return_branch_id or "").strip() or None
    if payload.return_same:
        rid = pid
    pickup_label = bmap.get(pid, "") if pid else ""
    return_label = bmap.get(rid, "") if rid else ""
    if pid and not pickup_label:
        pickup_label = f"Branch {pid}"
    if rid and not return_label:
        return_label = f"Branch {rid}"
    if not pickup_label:
        pickup_label = (v.get("name") or "Vehicle").strip() or "Pickup TBD"
    if not return_label:
        return_label = pickup_label

    try:
        cid = await _public_find_or_create_customer_id(
            payload.guest_full_name,
            str(payload.guest_email),
            payload.guest_phone,
        )
    except Exception:
        logger.exception("public_create_booking: customer create/find failed")
        raise HTTPException(
            status_code=500,
            detail="Could not save customer details. Please try again.",
        ) from None

    if st in UNAVAILABLE_FLEET_STATUSES:
        raise HTTPException(status_code=409, detail="This vehicle is not available for booking.")

    try:
        existing_bookings = await mysql_doc_list("bookings", 5000)
    except Exception:
        logger.exception("public_create_booking: list bookings failed")
        existing_bookings = []
    vid = str(v.get("id"))
    if await _vehicle_has_booking_conflict(vid, d_pick, d_ret, existing_bookings):
        raise HTTPException(
            status_code=409,
            detail="This vehicle is already booked for part of the selected dates. Please choose different dates.",
        )

    bid = str(uuid.uuid4())
    ts = now_iso()
    p_iso = d_pick.isoformat()
    r_iso = d_ret.isoformat()
    notes = (payload.notes or "").strip()
    booking: Dict[str, Any] = {
        "id": bid,
        "customer_id": cid,
        "vehicle_id": str(v.get("id")),
        "driver_id": None,
        "pickup_date": p_iso,
        "return_date": r_iso,
        "pickup_location": pickup_label,
        "return_location": return_label,
        "total_amount": total_amount,
        "status": "pending",
        "payment_status": "pending",
        "notes": notes,
        "source": "public_marketing",
        "rental_days": rental_days,
        "daily_rate_snapshot": daily,
        "pickup_branch_id": pid,
        "return_branch_id": rid,
        "vehicle_name_snapshot": (v.get("name") or "").strip()
        or " ".join(
            [str(v.get("brand") or "").strip(), str(v.get("model_name") or "").strip()]
        ).strip(),
        "guest_email_snapshot": str(payload.guest_email).strip().lower(),
        "guest_name_snapshot": (payload.guest_full_name or "").strip(),
        "guest_phone_snapshot": (payload.guest_phone or "").strip(),
        "created_at": ts,
        "updated_at": ts,
    }
    try:
        await mysql_doc_insert("bookings", booking)
    except Exception:
        logger.exception("public_create_booking: insert booking failed")
        raise HTTPException(
            status_code=500,
            detail="Could not save booking. Please try again later.",
        ) from None

    vehicle_name = str(v.get("name") or "Vehicle").strip() or "Vehicle"
    guest_name = str(payload.guest_full_name or "Guest").strip()
    try:
        settings = await _effective_settings_doc()
        await send_booking_emails(settings, booking, vehicle_name)
        await _record_notification_and_email(
            "booking",
            "New booking request",
            f"{guest_name} booked {vehicle_name} ({p_iso} to {r_iso}) — ${total_amount}",
        )
    except Exception:
        logger.exception("public_create_booking: email notification failed")

    return {
        "id": bid,
        "status": "pending",
        "rental_days": rental_days,
        "total_amount": total_amount,
        "daily_rate": daily,
        "pickup_date": p_iso,
        "return_date": r_iso,
        "vehicle_id": str(v.get("id")),
        "customer_id": cid,
    }


BLOCKING_BOOKING_STATUSES: Set[str] = {"pending", "confirmed", "ongoing"}
UNAVAILABLE_FLEET_STATUSES: Set[str] = {"maintenance", "rented", "out_of_service"}


def _parse_iso_calendar_date(raw: Any) -> Optional[date]:
    if raw is None:
        return None
    t = str(raw).strip()
    if not t:
        return None
    if "T" in t:
        t = t.split("T", 1)[0]
    t = t[:10]
    try:
        return datetime.strptime(t, "%Y-%m-%d").date()
    except ValueError:
        return None


def _booking_ranges_overlap(pick: date, ret: date, sel_from: date, sel_to: date) -> bool:
    return pick <= sel_to and ret >= sel_from


def _booking_is_active_for_availability(b: Dict[str, Any], today: date) -> bool:
    st = (b.get("status") or "").strip().lower()
    if st not in BLOCKING_BOOKING_STATUSES:
        return False
    pick = _parse_iso_calendar_date(b.get("pickup_date"))
    ret = _parse_iso_calendar_date(b.get("return_date"))
    if pick is None or ret is None:
        return False
    return ret >= today or (pick <= today <= ret)


def _serialize_public_availability_booking(b: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    pick = _parse_iso_calendar_date(b.get("pickup_date"))
    ret = _parse_iso_calendar_date(b.get("return_date"))
    if pick is None or ret is None:
        return None
    pl = (b.get("pickup_location") or "").strip()
    rl = (b.get("return_location") or "").strip()
    if pl and rl and pl != rl:
        label = f"{pl} → {rl}"
    elif pl:
        label = pl
    else:
        label = (b.get("vehicle_name_snapshot") or "Booking").strip() or "Booking"
    return {
        "vehicle_id": str(b.get("vehicle_id") or ""),
        "pickup_date": pick.isoformat(),
        "return_date": ret.isoformat(),
        "label": label,
        "status": (b.get("status") or "").strip().lower() or "pending",
    }


async def _vehicle_has_booking_conflict(
    vehicle_id: str, pick: date, ret: date, bookings: List[Dict[str, Any]]
) -> bool:
    for b in bookings:
        if str(b.get("vehicle_id") or "") != vehicle_id:
            continue
        st = (b.get("status") or "").strip().lower()
        if st not in BLOCKING_BOOKING_STATUSES:
            continue
        bp = _parse_iso_calendar_date(b.get("pickup_date"))
        br = _parse_iso_calendar_date(b.get("return_date"))
        if bp is None or br is None:
            continue
        if _booking_ranges_overlap(bp, br, pick, ret):
            return True
    return False


@api_router.get("/public/fleet-availability")
async def get_public_fleet_availability(
    request: Request,
    from_date: Optional[str] = Query(None, alias="from", description="Check range start YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, alias="to", description="Check range end YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=200),
):
    """
    Public (no auth): fleet vehicles plus active bookings for the marketing availability calendar.
    Optional from/to returns per-vehicle availability for that inclusive date range.
    """
    today = datetime.now(timezone.utc).date()
    try:
        items = await mysql_doc_list("vehicles", 2000)
    except Exception:
        logger.exception("get_public_fleet_availability: list vehicles failed")
        items = []
    try:
        br_items = await mysql_doc_list("branches", 500)
    except Exception:
        logger.exception("get_public_fleet_availability: list branches failed")
        br_items = []
    try:
        all_bookings = await mysql_doc_list("bookings", 5000)
    except Exception:
        logger.exception("get_public_fleet_availability: list bookings failed")
        all_bookings = []

    bmap = _branch_display_map(br_items)
    vehicles_out: List[Dict[str, Any]] = []
    for v in items:
        st = (v.get("status") or "").strip()
        if st == "out_of_service":
            continue
        ordered_imgs = _public_vehicle_browser_image_urls(v, request)
        image_url = ordered_imgs[0] if ordered_imgs else None
        bid = str(v.get("branch_id") or "").strip()
        branch_display = bmap.get(bid) if bid else None
        features = v.get("features") if isinstance(v.get("features"), list) else []
        vehicles_out.append(
            {
                "id": v.get("id"),
                "name": v.get("name"),
                "brand": v.get("brand"),
                "model_name": v.get("model_name"),
                "category": v.get("category") or "General",
                "fuel_type": v.get("fuel_type"),
                "transmission": v.get("transmission"),
                "seats": v.get("seats"),
                "daily_rate": v.get("daily_rate"),
                "status": st or "available",
                "features": features,
                "image_url": image_url,
                "branch_display": branch_display,
                "fleet_available": st not in UNAVAILABLE_FLEET_STATUSES,
            }
        )
        if len(vehicles_out) >= limit:
            break

    bookings_out: List[Dict[str, Any]] = []
    for b in all_bookings:
        if not _booking_is_active_for_availability(b, today):
            continue
        row = _serialize_public_availability_booking(b)
        if row and row.get("vehicle_id"):
            bookings_out.append(row)

    sel_from: Optional[date] = None
    sel_to: Optional[date] = None
    if from_date and to_date:
        try:
            sel_from = _parse_public_booking_calendar_date(from_date)
            sel_to = _parse_public_booking_calendar_date(to_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid from/to dates (use YYYY-MM-DD).",
            ) from None
        if sel_to < sel_from:
            raise HTTPException(status_code=400, detail="End date must be on or after start date.")

    results: Optional[List[Dict[str, Any]]] = None
    if sel_from and sel_to:
        rental_days = max(1, (sel_to - sel_from).days + 1)
        results = []
        for v in vehicles_out:
            vid = str(v.get("id") or "")
            fleet_ok = bool(v.get("fleet_available"))
            conflicts = [
                c
                for c in bookings_out
                if c.get("vehicle_id") == vid
                and _booking_ranges_overlap(
                    _parse_iso_calendar_date(c.get("pickup_date")) or sel_from,
                    _parse_iso_calendar_date(c.get("return_date")) or sel_to,
                    sel_from,
                    sel_to,
                )
            ]
            booking_blocked = len(conflicts) > 0
            available = fleet_ok and not booking_blocked
            daily = float(v.get("daily_rate") or 0)
            results.append(
                {
                    "vehicle_id": vid,
                    "available": available,
                    "fleet_available": fleet_ok,
                    "booking_blocked": booking_blocked,
                    "rental_days": rental_days,
                    "total_amount": round(daily * rental_days, 2) if daily > 0 else 0,
                    "daily_rate": daily,
                    "conflicts": conflicts,
                }
            )

    categories = sorted({str(v.get("category") or "General") for v in vehicles_out})

    return {
        "vehicles": vehicles_out,
        "bookings": bookings_out,
        "categories": ["All", *categories],
        "checked_range": (
            {"from": sel_from.isoformat(), "to": sel_to.isoformat()} if sel_from and sel_to else None
        ),
        "results": results,
    }


@api_router.get("/public/vehicles")
async def get_public_vehicles(
    request: Request,
    limit: int = Query(60, ge=1, le=200),
    status: Optional[str] = Query(
        None,
        description="Filter by status (e.g. available). Omit to return all non–out_of_service.",
    ),
):
    """Public (no auth): fleet for marketing sites — no registration numbers or internal-only paths."""
    try:
        items = await mysql_doc_list("vehicles", 2000)
    except Exception:
        logger.exception("get_public_vehicles: list failed")
        return []
    try:
        br_items = await mysql_doc_list("branches", 500)
    except Exception:
        logger.exception("get_public_vehicles: list branches failed")
        br_items = []
    bmap = _branch_display_map(br_items)
    skip = {"out_of_service"}
    out: List[Dict[str, Any]] = []
    for v in items:
        st = (v.get("status") or "").strip()
        if st in skip:
            continue
        if status and st != status.strip():
            continue
        ordered_imgs = _public_vehicle_browser_image_urls(v, request)
        image_url = ordered_imgs[0] if ordered_imgs else None
        image_slots = _public_vehicle_image_slots(v, request)
        bid = str(v.get("branch_id") or "").strip()
        branch_display = bmap.get(bid) if bid else None
        out.append(
            {
                "id": v.get("id"),
                "name": v.get("name"),
                "brand": v.get("brand"),
                "model_name": v.get("model_name"),
                "description": (str(v.get("description") or "").strip() or None),
                "category": v.get("category"),
                "year": v.get("year"),
                "fuel_type": v.get("fuel_type"),
                "transmission": v.get("transmission"),
                "seats": v.get("seats"),
                "daily_rate": v.get("daily_rate"),
                "status": st,
                "condition": v.get("condition"),
                "features": v.get("features") if isinstance(v.get("features"), list) else [],
                "image_url": image_url,
                "gallery_images": ordered_imgs,
                "image_slots": image_slots,
                "branch_id": bid or None,
                "branch_display": branch_display,
            }
        )
        if len(out) >= limit:
            break
    return out


@api_router.get("/public/vehicles/{vehicle_id}")
async def get_public_vehicle_detail(request: Request, vehicle_id: str):
    """Public (no auth): one vehicle for marketing detail pages — excludes registration and internal paths."""
    try:
        v = await mysql_doc_find_one("vehicles", vehicle_id)
    except Exception:
        logger.exception("get_public_vehicle_detail: find failed")
        raise HTTPException(status_code=500, detail="Could not load vehicle")
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    st = (v.get("status") or "").strip()
    if st == "out_of_service":
        raise HTTPException(status_code=404, detail="Vehicle not found")

    def _str_list(key: str) -> List[str]:
        raw = v.get(key)
        if not isinstance(raw, list):
            return []
        return [str(x).strip() for x in raw if str(x).strip()]

    image_slots = _public_vehicle_image_slots(v, request)
    ordered_imgs = [s["url"] for s in image_slots]
    image_url = ordered_imgs[0] if ordered_imgs else None
    gallery_images = ordered_imgs

    bid = str(v.get("branch_id") or "").strip()
    branch_display = None
    if bid:
        try:
            br_items = await mysql_doc_list("branches", 500)
            branch_display = _branch_display_map(br_items).get(bid)
        except Exception:
            logger.exception("get_public_vehicle_detail: branches failed")

    return {
        "id": v.get("id"),
        "name": v.get("name"),
        "brand": v.get("brand"),
        "model_name": v.get("model_name"),
        "description": (str(v.get("description") or "").strip() or None),
        "category": v.get("category"),
        "year": v.get("year"),
        "fuel_type": v.get("fuel_type"),
        "transmission": v.get("transmission"),
        "seats": v.get("seats"),
        "doors": v.get("doors"),
        "luggage_capacity": v.get("luggage_capacity"),
        "daily_rate": v.get("daily_rate"),
        "weekly_rate": v.get("weekly_rate"),
        "monthly_rate": v.get("monthly_rate"),
        "hourly_rate": v.get("hourly_rate"),
        "deposit_amount": v.get("deposit_amount"),
        "insurance_cost": v.get("insurance_cost"),
        "driver_fee": v.get("driver_fee"),
        "late_return_fee": v.get("late_return_fee"),
        "airport_pickup_fee": v.get("airport_pickup_fee"),
        "extra_charges": v.get("extra_charges"),
        "discount_rate": v.get("discount_rate"),
        "mileage": v.get("mileage"),
        "mileage_limit_per_day": v.get("mileage_limit_per_day"),
        "status": st,
        "condition": v.get("condition"),
        "features": _str_list("features"),
        "comfort_features": _str_list("comfort_features"),
        "safety_features": _str_list("safety_features"),
        "fuel_policy": v.get("fuel_policy"),
        "cancellation_policy": v.get("cancellation_policy"),
        "smoking_policy": v.get("smoking_policy"),
        "pets_policy": v.get("pets_policy"),
        "cross_border_policy": v.get("cross_border_policy"),
        "min_driver_age": v.get("min_driver_age"),
        "license_requirements": v.get("license_requirements"),
        "international_license_policy": v.get("international_license_policy"),
        "id_requirements": v.get("id_requirements"),
        "engine_size": v.get("engine_size"),
        "horsepower": v.get("horsepower"),
        "fuel_consumption": v.get("fuel_consumption"),
        "air_conditioning": bool(v.get("air_conditioning", True)),
        "gps_enabled": bool(v.get("gps_enabled")),
        "bluetooth_usb": bool(v.get("bluetooth_usb")),
        "android_auto_carplay": bool(v.get("android_auto_carplay")),
        "backup_camera": bool(v.get("backup_camera")),
        "parking_sensors": bool(v.get("parking_sensors")),
        "cruise_control": bool(v.get("cruise_control")),
        "heated_seats": bool(v.get("heated_seats")),
        "leather_seats": bool(v.get("leather_seats")),
        "sunroof": bool(v.get("sunroof")),
        "child_seat_support": bool(v.get("child_seat_support")),
        "wifi_available": bool(v.get("wifi_available")),
        "abs_brakes": bool(v.get("abs_brakes", True)),
        "airbags": bool(v.get("airbags", True)),
        "stability_control": bool(v.get("stability_control")),
        "lane_assist": bool(v.get("lane_assist")),
        "emergency_braking": bool(v.get("emergency_braking")),
        "tire_pressure_monitoring": bool(v.get("tire_pressure_monitoring")),
        "security_alarm": bool(v.get("security_alarm")),
        "branch_id": bid or None,
        "branch_display": branch_display,
        "image_url": image_url,
        "gallery_images": gallery_images,
        "image_slots": image_slots,
    }


@api_router.get("/settings")
async def get_settings(user=Depends(get_current_user)):
    s = await mysql_settings_get()
    if not s:
        default = {**_settings_default_dict(), "updated_at": now_iso()}
        await mysql_settings_upsert(default)
        default.pop("_id", None)
        default["smtp_configured"] = bool(smtp_config_from_settings(default))
        return default
    merged = {**_settings_default_dict(), **s}
    merged.pop("_id", None)
    if merged.get("currency") not in ("USD", "RWF"):
        merged["currency"] = "USD"
    merged["smtp_configured"] = bool(smtp_config_from_settings(merged))
    return merged

@api_router.put("/settings")
async def update_settings(payload: SettingsIn, user=Depends(get_current_user)):
    doc = payload.model_dump()
    doc["id"] = "global"
    doc["updated_at"] = now_iso()
    await mysql_settings_upsert(doc)
    await log_activity(user["email"], "update_settings")
    doc["smtp_configured"] = bool(smtp_config_from_settings(doc))
    return doc


@api_router.post("/settings/test-email")
async def test_settings_email(payload: TestEmailIn = TestEmailIn(), user=Depends(get_current_user)):
    settings = await _effective_settings_doc()
    if not smtp_config_from_settings(settings):
        raise HTTPException(
            status_code=400,
            detail="SMTP not configured. Set SMTP_PASSWORD in backend/.env and verify host/user in Settings.",
        )
    to = str(payload.to or admin_notify_email(settings) or "").strip().lower()
    if not to:
        raise HTTPException(status_code=400, detail="No recipient email. Set Notification email to in Settings.")
    ok = await send_test_email(settings, to)
    if not ok:
        raise HTTPException(status_code=502, detail="Failed to send test email. Check server logs for SMTP errors.")
    await log_activity(user["email"], "test_email", to)
    return {"ok": True, "sent_to": to}

@api_router.get("/users")
async def list_users(user=Depends(get_current_user)):
    return await mysql_users_list(500)

# ---------- Reports ----------
@api_router.get("/reports/financial")
async def financial_report(user=Depends(get_current_user)):
    payments = await mysql_doc_list("payments", 5000)
    total_in = sum(p["amount"] for p in payments if p.get("type") == "payment" and p.get("status") == "completed")
    total_refunds = sum(p["amount"] for p in payments if p.get("type") == "refund")
    deposits = sum(p["amount"] for p in payments if p.get("type") == "deposit")
    return {
        "total_revenue": round(total_in, 2),
        "total_refunds": round(total_refunds, 2),
        "deposits": round(deposits, 2),
        "net": round(total_in - total_refunds, 2),
        "tax_estimate": round(total_in * 0.18, 2),
    }

@api_router.get("/reports/operational")
async def operational_report(user=Depends(get_current_user)):
    bookings = await mysql_doc_list("bookings", 5000)
    vehicles = await mysql_doc_list("vehicles", 2000)
    return {
        "total_bookings": len(bookings),
        "vehicle_utilization_pct": round((sum(1 for v in vehicles if v.get("status") == "rented") / max(len(vehicles), 1)) * 100, 2),
        "avg_booking_value": round(sum(b.get("total_amount", 0) for b in bookings) / max(len(bookings), 1), 2),
    }

# ---------- Exports (CSV / Excel / PDF) ----------
# openpyxl → numpy on some installs; reportlab is heavy. Lazy-import inside handlers so
# Passenger/shared hosts without AVX2-compatible numpy wheels can still boot the API.

EXPORTABLE = {
    "vehicles": ["name", "brand", "category", "registration_number", "year", "fuel_type", "transmission", "daily_rate", "status", "mileage"],
    "bookings": [
        "id",
        "customer_id",
        "guest_name_snapshot",
        "guest_email_snapshot",
        "guest_phone_snapshot",
        "vehicle_id",
        "pickup_date",
        "return_date",
        "total_amount",
        "status",
        "payment_status",
    ],
    "customers": ["full_name", "email", "phone", "license_number", "city", "country", "loyalty_points", "wallet_balance", "is_blacklisted"],
    "drivers": ["full_name", "phone", "email", "license_number", "is_available", "salary", "rating", "trips_completed"],
    "payments": ["reference", "booking_id", "amount", "method", "type", "status", "created_at"],
    "maintenance": ["vehicle_id", "type", "description", "cost", "scheduled_date", "status", "garage"],
    "promotions": ["code", "description", "discount_percent", "valid_from", "valid_until", "is_active", "used_count", "usage_limit"],
    "reviews": ["customer_id", "vehicle_id", "rating", "comment", "is_approved"],
    "branches": ["name", "city", "address", "manager", "phone", "email"],
    "vehicle_categories": ["name", "description", "display_order", "is_active"],
    "team_members": ["full_name", "role", "email", "phone", "display_order", "is_visible", "photo_path"],
    "testimonials": ["name", "role", "testimonial", "rating", "display_order", "is_visible", "profile_image"],
    "marketing_services": ["title", "body", "display_order", "is_published"],
    "tickets": ["subject", "customer_email", "priority", "status", "created_at"],
}

@api_router.get("/exports/{resource}.{fmt}")
async def export_resource(resource: str, fmt: str, user=Depends(get_current_user)):
    if resource not in EXPORTABLE:
        raise HTTPException(status_code=400, detail=f"Resource '{resource}' is not exportable")
    if fmt not in ("csv", "xlsx", "pdf"):
        raise HTTPException(status_code=400, detail="Format must be csv, xlsx, or pdf")

    company_name = (await _effective_settings_doc()).get("company_name") or "NovaCar Admin"

    cols = EXPORTABLE[resource]
    items = await mysql_doc_list(resource, 5000)
    rows = [[str(i.get(c, ""))[:200] for c in cols] for i in items]

    filename = f"{resource}_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

    if fmt == "csv":
        buf = io.StringIO()
        writer = _csv.writer(buf)
        writer.writerow([c.replace("_", " ").upper() for c in cols])
        writer.writerows(rows)
        await log_activity(user["email"], f"export_{resource}_csv")
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )

    if fmt == "xlsx":
        try:
            from openpyxl import Workbook
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail="Excel export unavailable on this server (openpyxl/numpy). Use CSV export, or reinstall numpy for your CPU (see hosting docs).",
            ) from e
        wb = Workbook()
        ws = wb.active
        ws.title = resource[:31]
        ws.append([c.replace("_", " ").upper() for c in cols])
        for row in rows:
            ws.append(row)
        for i, _ in enumerate(cols, 1):
            ws.column_dimensions[chr(64 + i)].width = 18
        out = io.BytesIO()
        wb.save(out)
        out.seek(0)
        await log_activity(user["email"], f"export_{resource}_xlsx")
        return StreamingResponse(
            iter([out.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
        )

    # PDF (lazy import — keeps cold start light)
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors as rl_colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="PDF export unavailable (reportlab failed to load). Use CSV instead.",
        ) from e
    out = io.BytesIO()
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=24, rightMargin=24, topMargin=32, bottomMargin=24)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"<b>{company_name} — {resource.replace('_', ' ').title()} Report</b>", styles["Title"]),
        Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} · {len(items)} records", styles["Normal"]),
        Spacer(1, 12),
    ]
    table_data = [[c.replace("_", " ").upper() for c in cols]] + rows
    tbl = Table(table_data, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), rl_colors.HexColor("#E60000")),
        ("TEXTCOLOR", (0, 0), (-1, 0), rl_colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, rl_colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [rl_colors.white, rl_colors.HexColor("#FAFAFA")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tbl)
    doc.build(story)
    out.seek(0)
    await log_activity(user["email"], f"export_{resource}_pdf")
    return StreamingResponse(
        iter([out.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )

# ---------- AI Smart Features ----------
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    LlmChat = None  # type: ignore[misc, assignment]
    UserMessage = None  # type: ignore[misc, assignment]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

class AIRecommendIn(BaseModel):
    customer_id: Optional[str] = None
    preferences: Optional[str] = None  # free-text "I need an SUV for 5 days, family trip"

@api_router.post("/ai/recommend")
async def ai_recommend(payload: AIRecommendIn, user=Depends(get_current_user)):
    if LlmChat is None or UserMessage is None:
        raise HTTPException(
            status_code=503,
            detail="AI features require the proprietary emergentintegrations package (not published on PyPI).",
        )
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")
    vehicles = await mysql_doc_list("vehicles", 50, status="available")
    veh_text = "\n".join([f"- {v['name']} | {v.get('category')} | seats {v.get('seats')} | {v.get('fuel_type')} | ${v.get('daily_rate')}/day | {v.get('transmission')}" for v in vehicles[:25]])
    customer_ctx = ""
    if payload.customer_id:
        c = await mysql_doc_find_one("customers", payload.customer_id)
        if c:
            past = await mysql_doc_list("bookings", 20, eq_filters={"customer_id": payload.customer_id})
            customer_ctx = f"Customer: {c.get('full_name')}, loyalty {c.get('loyalty_points')} pts, past bookings: {len(past)}"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommend-{payload.customer_id or 'guest'}",
        system_message="You are a car rental concierge. Recommend the top 3 vehicles from the provided fleet that best match the customer needs. Reply in concise plain text with: 1) Top pick (name + 1 sentence reason), 2) Alternative (name + 1 sentence reason), 3) Budget option (name + 1 sentence reason). No markdown, no greeting."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    msg = UserMessage(text=f"AVAILABLE FLEET:\n{veh_text}\n\n{customer_ctx}\n\nCUSTOMER PREFERENCES: {payload.preferences or 'No specific preferences provided'}")
    try:
        response = await chat.send_message(msg)
        await log_activity(user["email"], "ai_recommend")
        return {"recommendation": response, "available_count": len(vehicles)}
    except Exception as e:
        logger.exception("ai_recommend failed")
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

@api_router.post("/ai/dynamic-pricing")
async def ai_dynamic_pricing(user=Depends(get_current_user)):
    if LlmChat is None or UserMessage is None:
        raise HTTPException(
            status_code=503,
            detail="AI features require the proprietary emergentintegrations package (not published on PyPI).",
        )
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")
    vehicles = await mysql_doc_list("vehicles", 50)
    bookings = await mysql_doc_list("bookings", 500)

    veh_summary = []
    for v in vehicles[:15]:
        veh_bookings = sum(1 for b in bookings if b.get("vehicle_id") == v["id"])
        veh_summary.append(f"- {v['name']} | category {v.get('category')} | base ${v.get('daily_rate')}/day | status {v.get('status')} | bookings: {veh_bookings}")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="pricing-advisor",
        system_message="You are a revenue management AI for a car rental company. Analyze the fleet utilization and recommend dynamic price adjustments. Output ONLY a plain-text list with format: 'Vehicle Name → suggested multiplier (e.g., 1.15x or 0.90x) → 1-line reason'. Cover top 5 highest-impact recommendations."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    msg = UserMessage(text=f"FLEET UTILIZATION DATA:\n{chr(10).join(veh_summary)}\n\nTotal bookings: {len(bookings)}\nCurrent month: {datetime.now(timezone.utc).strftime('%B %Y')}")
    try:
        response = await chat.send_message(msg)
        await log_activity(user["email"], "ai_dynamic_pricing")
        return {"suggestions": response, "vehicles_analyzed": len(vehicles)}
    except Exception as e:
        logger.exception("ai_dynamic_pricing failed")
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

@api_router.post("/ai/demand-prediction")
async def ai_demand_prediction(user=Depends(get_current_user)):
    if LlmChat is None or UserMessage is None:
        raise HTTPException(
            status_code=503,
            detail="AI features require the proprietary emergentintegrations package (not published on PyPI).",
        )
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="LLM key not configured")
    bookings = await mysql_doc_list("bookings", 1000)
    vehicles = await mysql_doc_list("vehicles", 100)

    # Build category breakdown
    cat_counts: Dict[str, int] = {}
    for b in bookings:
        v = next((x for x in vehicles if x["id"] == b.get("vehicle_id")), None)
        if v:
            cat = v.get("category", "Other")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
    breakdown = "\n".join([f"- {k}: {v} bookings" for k, v in cat_counts.items()])

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="demand-predictor",
        system_message="You are a demand forecasting AI for a car rental business. Provide a brief forecast (4-6 short sentences) covering: expected demand trend next 30 days, top categories to stock up, any oversupply risks. Plain text only."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    msg = UserMessage(text=f"HISTORICAL BOOKINGS BY CATEGORY:\n{breakdown}\n\nTotal fleet: {len(vehicles)} vehicles\nTotal bookings: {len(bookings)}\nCurrent month: {datetime.now(timezone.utc).strftime('%B %Y')}")
    try:
        response = await chat.send_message(msg)
        await log_activity(user["email"], "ai_demand_prediction")
        return {"forecast": response}
    except Exception as e:
        logger.exception("ai_demand_prediction failed")
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

# ---------- CMS defaults (terms + service for admin / public API) ----------
async def mysql_ensure_default_vehicle_categories() -> None:
    """Seed default fleet categories when the table is empty."""
    defaults = [
        ("SUV", "Sport utility and 4x4 vehicles for safari and family travel", 0),
        ("Sedan", "Comfortable sedans for city and highway driving", 1),
        ("Luxury", "Premium executive and luxury vehicles", 2),
        ("Van", "Passenger vans and minibuses for groups", 3),
        ("Pickup", "Pickup trucks for cargo and adventure", 4),
        ("Economy", "Budget-friendly compact rentals", 5),
        ("Sports", "Performance and sports cars", 6),
        ("Truck", "Commercial and heavy-duty trucks", 7),
    ]
    try:
        count = await mysql_doc_count("vehicle_categories")
    except Exception:
        logger.exception("mysql_ensure_default_vehicle_categories: count failed")
        return
    if count > 0:
        return
    for name, description, order in defaults:
        doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "display_order": order,
            "is_active": True,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        try:
            await mysql_doc_insert("vehicle_categories", doc)
        except Exception:
            logger.exception("mysql_ensure_default_vehicle_categories: insert %s failed", name)
    logger.info("mysql_ensure_default_vehicle_categories: seeded %s categories", len(defaults))


async def mysql_ensure_default_cms_pages() -> None:
    """
    Ensure `terms` and `service` rows exist for the admin CMS editors and GET /api/public/cms-page/{key}.
    Idempotent: skips keys already present. If only legacy key `services` exists, clones it to `service`.
    """
    try:
        items = await mysql_doc_list("cms_pages", 2000)
    except Exception:
        logger.exception("mysql_ensure_default_cms_pages: list cms_pages failed")
        return

    def _by_key(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        out: Dict[str, Dict[str, Any]] = {}
        for d in rows:
            k = str(d.get("key", "")).strip().lower()
            if k:
                out[k] = d
        return out

    by_key = _by_key(items)
    legacy = by_key.get("services")
    if legacy and "service" not in by_key:
        doc = {
            "id": str(uuid.uuid4()),
            "key": "service",
            "title": (str(legacy.get("title") or "").strip() or "Our Services"),
            "content": legacy.get("content") or "",
            "seo_title": legacy.get("seo_title"),
            "seo_description": legacy.get("seo_description"),
            "is_published": bool(legacy.get("is_published", True)),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        try:
            await mysql_doc_insert("cms_pages", doc)
            logger.info("mysql_ensure_default_cms_pages: added cms_pages key=service from legacy key=services")
        except Exception:
            logger.exception("mysql_ensure_default_cms_pages: clone services→service failed")
        try:
            items = await mysql_doc_list("cms_pages", 2000)
            by_key = _by_key(items)
        except Exception:
            logger.exception("mysql_ensure_default_cms_pages: re-list after clone failed")
            return

    templates: Dict[str, Dict[str, Any]] = {
        "home": {
            "key": "home",
            "title": "Drive East Africa.\nYour Way.",
            "content": (
                "Premium vehicles for Rwanda, Uganda and Tanzania — safari-ready 4x4s, executive sedans, "
                "and group transport with 24/7 support."
            ),
            "hero_eyebrow": "East Africa's Trusted Car Rental Partner",
            "seo_title": "Nova Car Rentals",
            "seo_description": "Premium car rentals across Rwanda, Uganda, and Tanzania.",
            "is_published": True,
        },
        "fleet": {
            "key": "fleet",
            "title": "Our Fleet",
            "content": "",
            "seo_title": "Our Fleet",
            "seo_description": "Browse safari 4x4s, executive sedans, and group vans for East Africa.",
            "is_published": True,
        },
        "destinations": {
            "key": "destinations",
            "title": "One Fleet.\nThree Countries.",
            "content": (
                "NOVACAR RENTALS operates across Rwanda, Uganda, and Tanzania — giving you the freedom "
                "to cross borders, follow the migration, climb the volcano, or simply explore at your own pace."
            ),
            "seo_title": "Destinations",
            "seo_description": "Explore Rwanda, Uganda, and Tanzania with a vehicle matched to every road.",
            "is_published": True,
            "hero_eyebrow": "Destinations",
            "destination_countries": [
                {
                    "name": "Rwanda",
                    "tagline": "The Land of a Thousand Hills",
                    "description": (
                        "From the vibrant capital Kigali to the misty volcanic slopes of the north and the shores "
                        "of Lake Kivu, Rwanda is a nation of extraordinary beauty and remarkable accessibility."
                    ),
                    "icon": "mountain",
                    "cities": ["Kigali", "Musanze", "Rubavu", "Huye", "Rusizi", "Nyagatare"],
                    "parks": [
                        {"name": "Volcanoes National Park", "highlight": "Gorilla Trekking"},
                        {"name": "Akagera National Park", "highlight": "Big Five Safari"},
                        {"name": "Nyungwe National Park", "highlight": "Chimpanzees & Canopy Walk"},
                        {"name": "Lake Kivu", "highlight": "Scenic Lakeside Drive"},
                    ],
                    "img_bg": "bg-gradient-to-br from-green-900/30 to-background",
                    "cover_image": None,
                    "display_order": 0,
                },
                {
                    "name": "Uganda",
                    "tagline": "The Pearl of Africa",
                    "description": (
                        "Uganda's extraordinary biodiversity makes it one of Africa's premier wildlife destinations. "
                        "Trek with mountain gorillas in Bwindi, cruise down the Nile from Jinja, or witness Murchison Falls."
                    ),
                    "icon": "trees",
                    "cities": ["Kampala", "Entebbe", "Jinja", "Mbarara", "Kabale"],
                    "parks": [
                        {"name": "Bwindi Impenetrable Forest", "highlight": "Mountain Gorillas"},
                        {"name": "Queen Elizabeth National Park", "highlight": "Tree-climbing Lions"},
                        {"name": "Murchison Falls National Park", "highlight": "Murchison Falls"},
                        {"name": "Kibale National Park", "highlight": "Chimpanzee Trekking"},
                    ],
                    "img_bg": "bg-gradient-to-br from-emerald-900/30 to-background",
                    "cover_image": None,
                    "display_order": 1,
                },
                {
                    "name": "Tanzania",
                    "tagline": "Africa's Untamed Frontier",
                    "description": (
                        "Tanzania is home to Serengeti, Kilimanjaro, the Ngorongoro Crater, and Zanzibar's white-sand shores. "
                        "Our vehicles give you access from Dar es Salaam to the remotest corners of the savanna."
                    ),
                    "icon": "waves",
                    "cities": ["Dar es Salaam", "Arusha", "Moshi", "Mwanza", "Dodoma", "Zanzibar"],
                    "parks": [
                        {"name": "Serengeti National Park", "highlight": "Great Migration"},
                        {"name": "Ngorongoro Conservation Area", "highlight": "Crater Safari"},
                        {"name": "Tarangire National Park", "highlight": "Elephant Herds"},
                        {"name": "Mount Kilimanjaro", "highlight": "Africa's Highest Peak"},
                    ],
                    "img_bg": "bg-gradient-to-br from-amber-900/30 to-background",
                    "cover_image": None,
                    "display_order": 2,
                },
            ],
            "airports_eyebrow": "Airport Coverage",
            "airports_title": "We Cover Every Major Airport",
            "airports_intro": (
                "Our drivers monitor your flight in real time. We'll be there, whether you land on schedule or not."
            ),
            "destination_airports": [
                {"city": "Kigali", "country": "Rwanda", "code": "KGL", "airport": "Kigali International Airport"},
                {"city": "Entebbe", "country": "Uganda", "code": "EBB", "airport": "Entebbe International Airport"},
                {
                    "city": "Dar es Salaam",
                    "country": "Tanzania",
                    "code": "DAR",
                    "airport": "Julius Nyerere International Airport",
                },
                {"city": "Arusha", "country": "Tanzania", "code": "ARK", "airport": "Arusha Airport"},
                {"city": "Zanzibar", "country": "Tanzania", "code": "ZNZ", "airport": "Abeid Amani Karume International"},
                {"city": "Mwanza", "country": "Tanzania", "code": "MWZ", "airport": "Mwanza Airport"},
            ],
            "cross_border_eyebrow": "Cross-Border Travel",
            "cross_border_title": "Seamless Border Crossings",
            "cross_border_description": (
                "All required documentation, cross-border permits, and insurance are handled by our team. "
                "You focus on the journey — we handle the paperwork."
            ),
            "cross_border_button": "Plan Your Multi-Country Trip",
        },
        "contact": {
            "key": "contact",
            "title": "Contact",
            "content": "",
            "seo_title": "Contact",
            "seo_description": "Get in touch for quotes, bookings, and 24/7 roadside support.",
            "is_published": True,
        },
        "guides": {
            "key": "guides",
            "title": "Travel Guides",
            "content": "",
            "seo_title": "Travel Guides",
            "seo_description": "Expert driving guides for Kigali, Serengeti, Kampala, and beyond.",
            "is_published": True,
        },
        "blogs": {
            "key": "blogs",
            "title": "Blog",
            "content": "",
            "seo_title": "Blog",
            "seo_description": "Travel tips, safari insights, and East Africa driving advice from NovaCar.",
            "is_published": True,
        },
        "terms": {
            "key": "terms",
            "title": "Terms & Conditions",
            "content": (
                "<h1>Terms &amp; Conditions</h1>"
                "<p>Edit this page in the admin under <strong>Marketing → Terms page</strong>. "
                "The marketing site can read it from <code>/api/public/cms-page/terms</code>.</p>"
            ),
            "seo_title": None,
            "seo_description": None,
            "is_published": True,
        },
        "service": {
            "key": "service",
            "title": "Every Journey,\nFully Covered.",
            "content": (
                "Whether you need a quick city transfer, a weeklong safari expedition, or a long-term corporate fleet "
                "— we have a service tailored to your exact needs."
            ),
            "seo_title": "Our Services",
            "seo_description": "Self-drive rentals, chauffeur hire, airport transfers, corporate fleet, safari 4x4s, and long-term leasing across East Africa.",
            "is_published": True,
            "hero_eyebrow": "Our Services",
            "service_items": [
                {
                    "icon": "car",
                    "title": "Self-Drive Car Rental",
                    "tagline": "Freedom to explore at your pace",
                    "description": "Take the wheel and discover East Africa on your own terms. Perfect for tourists, business professionals, NGOs, expatriates, and residents who prefer independence.",
                    "perks": [
                        "Flexible pick-up and drop-off locations",
                        "No minimum duration requirements",
                        "Comprehensive insurance included",
                        "GPS navigation available on request",
                        "24/7 roadside emergency support",
                        "Cross-border documentation handled",
                    ],
                    "cta_text": "Book Self-Drive",
                    "display_order": 0,
                },
                {
                    "icon": "user-check",
                    "title": "Chauffeur-Driven Car Hire",
                    "tagline": "Professional drivers, professional service",
                    "description": "Travel in complete comfort with experienced, professional drivers who know every road across Rwanda, Uganda, and Tanzania.",
                    "perks": [
                        "Vetted, multilingual professional drivers",
                        "Punctual and discreet service",
                        "Airport meet-and-greet service",
                        "Half-day and full-day hire options",
                        "Ideal for executives and VIP guests",
                        "Available for corporate events and conferences",
                    ],
                    "cta_text": "Book Chauffeur",
                    "display_order": 1,
                },
                {
                    "icon": "plane",
                    "title": "Airport Transfers",
                    "tagline": "Reliable, on time, every flight",
                    "description": "Stress-free arrivals and departures. We monitor your flight in real time and guarantee your driver will be waiting.",
                    "perks": [
                        "Real-time flight monitoring",
                        "Meet & greet with name board",
                        "Kigali, Entebbe, Dar es Salaam, Arusha, Zanzibar",
                        "Fixed pricing — no surge fees",
                        "Prompt, door-to-door service",
                        "Available 24 hours a day",
                    ],
                    "cta_text": "Book Airport Transfer",
                    "display_order": 2,
                },
                {
                    "icon": "building",
                    "title": "Corporate Car Rental",
                    "tagline": "Fleet solutions for businesses and organizations",
                    "description": "Flexible transport for businesses, embassies, NGOs, government institutions, and conference delegates.",
                    "perks": [
                        "Dedicated account management",
                        "Monthly invoicing available",
                        "Executive sedans, SUVs, and vans",
                        "Conference and event transportation",
                        "Embassy and diplomatic transport",
                        "Scalable — 1 vehicle to full fleet",
                    ],
                    "cta_text": "Request Corporate Quote",
                    "display_order": 3,
                },
                {
                    "icon": "camera",
                    "title": "Safari Vehicle Rental",
                    "tagline": "Built for the wild",
                    "description": "Fully equipped 4x4 safari vehicles ideal for national park game drives, wildlife photography tours, and gorilla trekking.",
                    "perks": [
                        "Pop-up roof for wildlife photography",
                        "Extended fuel range for remote areas",
                        "Refrigerator and camping equipment available",
                        "Experienced safari driver-guides",
                        "All major parks: Serengeti, Bwindi, Akagera",
                        "Park permits and logistics assistance",
                    ],
                    "cta_text": "Book Safari Vehicle",
                    "display_order": 4,
                },
                {
                    "icon": "calendar",
                    "title": "Long-Term Car Leasing",
                    "tagline": "Cost-effective for extended stays",
                    "description": "Cost-effective vehicle leasing for businesses, development projects, consultants, and long-stay visitors.",
                    "perks": [
                        "Weekly and monthly pricing tiers",
                        "Full maintenance and servicing included",
                        "Swap vehicle if needed during lease",
                        "Insurance and roadside assist included",
                        "Perfect for expats and project staff",
                        "Dedicated fleet manager assigned",
                    ],
                    "cta_text": "Get Leasing Quote",
                    "display_order": 5,
                },
            ],
            "perfect_for_eyebrow": "Perfect For",
            "perfect_for_title": "Who We Serve",
            "perfect_for_items": [
                "Business Travel",
                "Family Vacations",
                "Safari Tours",
                "Gorilla Trekking",
                "Wedding Transportation",
                "Conference Transportation",
                "NGO Fleet Hire",
                "Diplomatic Missions",
                "Student Transport",
                "Airport Transfers",
                "Cross-Border Road Trips",
                "Tourism and Adventure",
            ],
            "bottom_cta_title": "Not Sure Which Service You Need?",
            "bottom_cta_description": (
                "Our team will help you find the right vehicle and service for your journey. "
                "No obligation — just expert advice."
            ),
            "bottom_cta_button": "Talk to Our Team",
        },
        "about": {
            "key": "about",
            "title": "Built on Trust. Driven by Passion.",
            "content": (
                "<p>NOVACAR RENTALS was founded on a simple belief: that travelers in East Africa "
                "deserve a rental experience as professional and reliable as anywhere else in the world. "
                "We built that experience — one vehicle at a time.</p>"
            ),
            "seo_title": "About Us",
            "seo_description": "Learn about NovaCar Rentals — trusted car hire across Rwanda, Uganda, and Tanzania.",
            "is_published": True,
            "hero_eyebrow": "About NOVACAR",
            "story_title": "From Kigali to the Serengeti and Back",
            "story_content": (
                "<p>NOVACAR RENTALS began in Kigali, Rwanda, with a small fleet of vehicles and a big "
                "commitment: to be the most reliable car rental partner in East Africa.</p>"
                "<p>Over the years, we've grown from a local operation into a regional fleet spanning "
                "Rwanda, Uganda, and Tanzania.</p>"
            ),
            "stats": [
                {"label": "Years of Service", "value": "8+"},
                {"label": "Vehicles in Fleet", "value": "150+"},
                {"label": "Happy Clients", "value": "10k+"},
                {"label": "Countries Covered", "value": "3"},
            ],
            "values": [
                {
                    "title": "Safety First",
                    "description": "Every vehicle is fully insured, regularly serviced, and inspected before every rental.",
                },
                {
                    "title": "Customer Obsession",
                    "description": "From the first inquiry to the final drop-off, we treat every traveler like our most important guest.",
                },
                {
                    "title": "Regional Expertise",
                    "description": "We know the roads of Rwanda, Uganda, and Tanzania like the back of our hand.",
                },
                {
                    "title": "Reliable & Responsive",
                    "description": "24/7 availability, real-time communication, and a team that actually picks up the phone.",
                },
            ],
            "promises": [
                "Transparent pricing — what you see is what you pay",
                "No hidden charges or surprise fees",
                "Dependable support before, during, and after your journey",
                "Professionally cleaned vehicles before every rental",
                "24/7 roadside emergency assistance",
                "Multilingual team: English, French, Kinyarwanda, Swahili",
                "Easy online booking with fast confirmation",
                "Cross-border documentation fully handled",
            ],
            "cta_title": "Ready to Experience NOVACAR?",
            "cta_description": (
                "Book your vehicle today and discover why thousands of travelers, businesses, "
                "and organizations trust us across East Africa."
            ),
            "story_image_rw": None,
            "story_image_ug": None,
            "story_image_tz": None,
            "story_quote": "Customer satisfaction is our highest priority.",
        },
    }
    for key, body in templates.items():
        if key in by_key:
            continue
        doc = {**body, "id": str(uuid.uuid4()), "created_at": now_iso(), "updated_at": now_iso()}
        try:
            await mysql_doc_insert("cms_pages", doc)
            logger.info("mysql_ensure_default_cms_pages: inserted default cms_pages key=%s", key)
        except Exception:
            logger.exception("mysql_ensure_default_cms_pages: insert key=%s failed", key)

    # Backfill home page when an older row exists with empty hero copy.
    home_existing = by_key.get("home")
    home_template = templates.get("home")
    if home_existing and home_template:
        patch_home: Dict[str, Any] = {**home_existing, "updated_at": now_iso()}
        changed = False
        for field in ("title", "content", "hero_eyebrow", "seo_title", "seo_description"):
            if not str(home_existing.get(field) or "").strip():
                patch_home[field] = home_template.get(field)
                changed = True
        if changed:
            try:
                item_id = str(home_existing.get("id") or "")
                if item_id:
                    await mysql_doc_update("cms_pages", item_id, patch_home)
                    logger.info("mysql_ensure_default_cms_pages: backfilled home cms page")
            except Exception:
                logger.exception("mysql_ensure_default_cms_pages: backfill home failed")

    # Backfill destinations page when an older row exists without structured country/airport data.
    dest_existing = by_key.get("destinations")
    dest_template = templates.get("destinations")
    if dest_existing and dest_template:
        countries = dest_existing.get("destination_countries")
        needs_countries = not isinstance(countries, list) or len(countries) == 0
        airports = dest_existing.get("destination_airports")
        needs_airports = not isinstance(airports, list) or len(airports) == 0
        if needs_countries or needs_airports:
            patch: Dict[str, Any] = {**dest_existing, "updated_at": now_iso()}
            if needs_countries:
                patch["destination_countries"] = dest_template.get("destination_countries") or []
            if needs_airports:
                patch["destination_airports"] = dest_template.get("destination_airports") or []
            for field in (
                "hero_eyebrow",
                "airports_eyebrow",
                "airports_title",
                "airports_intro",
                "cross_border_eyebrow",
                "cross_border_title",
                "cross_border_description",
                "cross_border_button",
            ):
                if not str(dest_existing.get(field) or "").strip():
                    patch[field] = dest_template.get(field)
            if not str(dest_existing.get("title") or "").strip():
                patch["title"] = dest_template.get("title")
            if not str(dest_existing.get("content") or "").strip():
                patch["content"] = dest_template.get("content")
            try:
                item_id = str(dest_existing.get("id") or "")
                if item_id:
                    await mysql_doc_update("cms_pages", item_id, patch)
                    logger.info("mysql_ensure_default_cms_pages: backfilled destinations cms page")
            except Exception:
                logger.exception("mysql_ensure_default_cms_pages: backfill destinations failed")

    # Backfill services page when an older row exists without structured service items.
    svc_existing = by_key.get("service")
    svc_template = templates.get("service")
    if svc_existing and svc_template:
        items = svc_existing.get("service_items")
        needs_items = not isinstance(items, list) or len(items) == 0
        perfect = svc_existing.get("perfect_for_items")
        needs_perfect = not isinstance(perfect, list) or len(perfect) == 0
        if needs_items or needs_perfect:
            patch: Dict[str, Any] = {**svc_existing, "updated_at": now_iso()}
            if needs_items:
                patch["service_items"] = svc_template.get("service_items") or []
            if needs_perfect:
                patch["perfect_for_items"] = svc_template.get("perfect_for_items") or []
            for field in (
                "hero_eyebrow",
                "perfect_for_eyebrow",
                "perfect_for_title",
                "bottom_cta_title",
                "bottom_cta_description",
                "bottom_cta_button",
            ):
                if not str(svc_existing.get(field) or "").strip():
                    patch[field] = svc_template.get(field)
            if not str(svc_existing.get("title") or "").strip() or "<h1>" in str(svc_existing.get("title") or ""):
                patch["title"] = svc_template.get("title")
            if not str(svc_existing.get("content") or "").strip() or "<p>Edit" in str(svc_existing.get("content") or ""):
                patch["content"] = svc_template.get("content")
            try:
                item_id = str(svc_existing.get("id") or "")
                if item_id:
                    await mysql_doc_update("cms_pages", item_id, patch)
                    logger.info("mysql_ensure_default_cms_pages: backfilled service cms page")
            except Exception:
                logger.exception("mysql_ensure_default_cms_pages: backfill service failed")


# ---------- Seed ----------
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@carrental.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await mysql_user_find_by_email(admin_email, exclude_password=False)
    if not existing:
        await mysql_user_insert({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Super Admin",
            "phone": None,
            "avatar_url": None,
            "password_hash": hash_password(admin_password),
            "role": "super_admin",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    else:
        if not verify_password(admin_password, existing["password_hash"]):
            await mysql_user_update_password(admin_email, hash_password(admin_password))

async def seed_demo_data():
    if await mysql_doc_count("vehicles") > 0:
        return
    logger.info("Seeding demo data...")

    # Branches
    branches = [
        {"name": "Downtown Hub", "city": "New York", "address": "120 Park Ave", "manager": "James Carter", "phone": "+1-212-555-0101", "email": "ny@eliteride.com", "is_pickup": True, "is_return": True, "lat": 40.7549, "lng": -73.9840},
        {"name": "Airport Branch", "city": "Los Angeles", "address": "1 World Way, LAX", "manager": "Sarah Lin", "phone": "+1-310-555-0188", "email": "lax@eliteride.com", "is_pickup": True, "is_return": True, "lat": 33.9416, "lng": -118.4085},
        {"name": "Beach Office", "city": "Miami", "address": "1500 Ocean Drive", "manager": "Carlos Vega", "phone": "+1-305-555-0142", "email": "mia@eliteride.com", "is_pickup": True, "is_return": True, "lat": 25.7825, "lng": -80.1340},
    ]
    branch_ids = []
    for b in branches:
        b["id"] = str(uuid.uuid4())
        b["created_at"] = now_iso()
        b["updated_at"] = now_iso()
        branch_ids.append(b["id"])
    await mysql_doc_insert_many("branches", branches)

    # Vehicles
    vehicle_data = [
        ("Tesla Model S", "Tesla", "Model S Plaid", "Luxury", "NY-2024-001", 2024, "Electric", "Automatic", 5, 220, "available", 8500, "https://images.unsplash.com/photo-1755880107456-8becf9a985bb?w=600"),
        ("Range Rover Sport", "Land Rover", "Sport HSE", "SUV", "LA-2023-014", 2023, "Petrol", "Automatic", 7, 180, "rented", 12400, "https://images.unsplash.com/photo-1763443536611-6fa59a9a4ed9?w=600"),
        ("Toyota Camry", "Toyota", "Camry XSE", "Sedan", "MIA-2024-007", 2024, "Hybrid", "Automatic", 5, 75, "available", 5200, None),
        ("BMW X5", "BMW", "X5 xDrive40i", "SUV", "NY-2023-022", 2023, "Petrol", "Automatic", 7, 150, "available", 9100, None),
        ("Mercedes E-Class", "Mercedes", "E350", "Luxury", "LA-2024-031", 2024, "Petrol", "Automatic", 5, 165, "maintenance", 6800, None),
        ("Honda Civic", "Honda", "Civic Touring", "Sedan", "MIA-2023-019", 2023, "Petrol", "Automatic", 5, 55, "available", 14200, None),
        ("Ford Mustang GT", "Ford", "Mustang GT", "Sports", "NY-2024-008", 2024, "Petrol", "Manual", 4, 140, "rented", 3400, None),
        ("Audi Q7", "Audi", "Q7 Premium", "SUV", "LA-2023-027", 2023, "Petrol", "Automatic", 7, 175, "available", 11500, None),
        ("Jeep Wrangler", "Jeep", "Wrangler Rubicon", "SUV", "MIA-2024-012", 2024, "Petrol", "Automatic", 4, 120, "out_of_service", 7800, None),
        ("Hyundai Elantra", "Hyundai", "Elantra SEL", "Sedan", "NY-2024-018", 2024, "Petrol", "Automatic", 5, 50, "available", 2900, None),
        ("Porsche 911", "Porsche", "911 Carrera", "Sports", "LA-2024-002", 2024, "Petrol", "Automatic", 4, 350, "reserved", 1800, None),
        ("Chevrolet Tahoe", "Chevrolet", "Tahoe LT", "SUV", "MIA-2023-033", 2023, "Petrol", "Automatic", 8, 130, "available", 10200, None),
    ]
    vehicles = []
    for name, brand, model_name, cat, reg, yr, fuel, trans, seats, rate, status, mile, img in vehicle_data:
        vehicles.append({
            "id": str(uuid.uuid4()),
            "name": name, "brand": brand, "model_name": model_name, "category": cat,
            "registration_number": reg, "year": yr, "fuel_type": fuel, "transmission": trans,
            "seats": seats, "daily_rate": rate, "discount_rate": None, "status": status,
            "mileage": mile, "image_url": img,
            "insurance_expiry": (datetime.now(timezone.utc) + timedelta(days=180)).isoformat(),
            "branch_id": branch_ids[hash(reg) % 3],
            "features": ["GPS", "Bluetooth", "AC", "Sunroof"] if cat != "Sedan" else ["Bluetooth", "AC"],
            "condition": "Excellent", "gps_enabled": True,
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    await mysql_doc_insert_many("vehicles", vehicles)

    # Customers
    customer_data = [
        ("Emily Johnson", "emily.j@example.com", "+1-555-0101", "DL-NY-9821", "USA"),
        ("Michael Chen", "m.chen@example.com", "+1-555-0102", "DL-CA-4412", "USA"),
        ("Olivia Martinez", "olivia.m@example.com", "+1-555-0103", "DL-FL-7733", "USA"),
        ("Daniel Smith", "d.smith@example.com", "+1-555-0104", "DL-NY-2256", "USA"),
        ("Ava Williams", "ava.w@example.com", "+1-555-0105", "DL-CA-9087", "USA"),
        ("Liam Garcia", "liam.g@example.com", "+1-555-0106", "DL-FL-1199", "USA"),
        ("Sophia Brown", "sophia.b@example.com", "+1-555-0107", "DL-NY-3344", "USA"),
        ("Noah Davis", "noah.d@example.com", "+1-555-0108", "DL-CA-5678", "USA"),
    ]
    customers = []
    for name, email, phone, dl, country in customer_data:
        customers.append({
            "id": str(uuid.uuid4()),
            "full_name": name, "email": email, "phone": phone, "license_number": dl,
            "address": "123 Demo Street", "city": "New York", "country": country,
            "emergency_contact": "+1-555-9999", "is_blacklisted": False,
            "loyalty_points": (hash(email) % 500) + 50, "wallet_balance": float((hash(email) % 200)),
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    await mysql_doc_insert_many("customers", customers)

    # Drivers
    drivers = []
    for n in ["Robert King", "Patricia Lee", "Henry Wright", "Linda Scott", "Patrick O'Brien"]:
        drivers.append({
            "id": str(uuid.uuid4()),
            "full_name": n, "phone": f"+1-555-0{(hash(n) % 900):03d}",
            "email": f"{n.split()[0].lower()}@eliteride.com",
            "license_number": f"DR-{hash(n) % 99999}",
            "is_available": (hash(n) % 2 == 0),
            "salary": 3500.0, "rating": round(4 + (hash(n) % 100) / 100, 1),
            "trips_completed": hash(n) % 200, "branch_id": branch_ids[hash(n) % 3],
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    await mysql_doc_insert_many("drivers", drivers)

    # Bookings + Payments (last 6 months)
    bookings = []
    payments = []
    statuses = ["pending", "confirmed", "ongoing", "completed", "completed", "completed", "cancelled"]
    for i in range(40):
        v = vehicles[i % len(vehicles)]
        c = customers[i % len(customers)]
        st = statuses[i % len(statuses)]
        days = (i % 7) + 1
        amount = v["daily_rate"] * days
        booked_days_ago = (i * 5) % 180
        ts = (datetime.now(timezone.utc) - timedelta(days=booked_days_ago)).isoformat()
        bookings.append({
            "id": str(uuid.uuid4()),
            "customer_id": c["id"], "vehicle_id": v["id"], "driver_id": None,
            "pickup_date": ts, "return_date": ts,
            "pickup_location": "Downtown Hub", "return_location": "Downtown Hub",
            "total_amount": amount, "status": st, "payment_status": "paid" if st == "completed" else "pending",
            "notes": "", "created_at": ts, "updated_at": ts,
        })
        if st == "completed":
            payments.append({
                "id": str(uuid.uuid4()),
                "booking_id": bookings[-1]["id"], "customer_id": c["id"],
                "amount": amount, "method": ["card", "cash", "bank_transfer", "mobile_money"][i % 4],
                "type": "payment", "status": "completed",
                "reference": f"TX-{1000 + i}",
                "created_at": ts, "updated_at": ts,
            })
    await mysql_doc_insert_many("bookings", bookings)
    if payments:
        await mysql_doc_insert_many("payments", payments)

    # Reviews
    reviews = []
    for i, c in enumerate(customers[:5]):
        reviews.append({
            "id": str(uuid.uuid4()),
            "customer_id": c["id"], "vehicle_id": vehicles[i]["id"],
            "rating": [5, 4, 5, 3, 4][i], "comment": ["Outstanding!", "Great car, smooth ride.", "Loved the experience.", "Decent value.", "Will rent again."][i],
            "is_approved": i != 3, "is_hidden": False,
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    await mysql_doc_insert_many("reviews", reviews)

    # Promotions
    promos = [
        {"code": "SUMMER25", "description": "25% off summer rentals", "discount_percent": 25, "discount_amount": 0,
        "valid_from": now_iso(), "valid_until": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
        "is_active": True, "usage_limit": 200, "used_count": 47},
        {"code": "WELCOME10", "description": "First-time customer 10% off", "discount_percent": 10, "discount_amount": 0,
        "valid_from": now_iso(), "valid_until": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
        "is_active": True, "usage_limit": 1000, "used_count": 312},
    ]
    for p in promos:
        p["id"] = str(uuid.uuid4()); p["created_at"] = now_iso(); p["updated_at"] = now_iso()
    await mysql_doc_insert_many("promotions", promos)

    # Maintenance
    maint = []
    for i, v in enumerate(vehicles[:5]):
        maint.append({
            "id": str(uuid.uuid4()),
            "vehicle_id": v["id"],
            "type": ["oil_change", "tire", "repair", "inspection", "oil_change"][i],
            "description": ["Routine oil change", "Front tire replacement", "Brake pad repair", "Annual inspection", "Oil & filter"][i],
            "cost": [80, 320, 450, 120, 90][i],
            "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=i * 7)).isoformat(),
            "completed_date": None,
            "status": ["scheduled", "in_progress", "completed", "scheduled", "scheduled"][i],
            "garage": "EliteRide Garage",
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    await mysql_doc_insert_many("maintenance", maint)

    # Tickets
    tickets = [
        {"subject": "Late return penalty inquiry", "customer_email": "emily.j@example.com", "description": "I returned the car 30 minutes late and was charged...", "priority": "medium", "status": "open"},
        {"subject": "Refund request for cancelled booking", "customer_email": "m.chen@example.com", "description": "Booking #4421 was cancelled due to weather.", "priority": "high", "status": "in_progress"},
        {"subject": "Damaged seat reported", "customer_email": "olivia.m@example.com", "description": "Found a scratch on the rear seat after pickup.", "priority": "low", "status": "resolved"},
    ]
    for t in tickets:
        t["id"] = str(uuid.uuid4()); t["created_at"] = now_iso(); t["updated_at"] = now_iso()
    await mysql_doc_insert_many("tickets", tickets)

    # Notifications
    notes = [
        {"type": "booking", "title": "New booking request", "message": "Emily Johnson booked Tesla Model S", "channel": "in_app", "is_read": False},
        {"type": "payment", "title": "Payment received", "message": "$650 received from Michael Chen", "channel": "in_app", "is_read": False},
        {"type": "maintenance", "title": "Oil change due", "message": "Range Rover Sport needs oil change in 3 days", "channel": "in_app", "is_read": True},
        {"type": "system", "title": "Insurance expiring soon", "message": "BMW X5 insurance expires in 14 days", "channel": "in_app", "is_read": False},
    ]
    for n in notes:
        n["id"] = str(uuid.uuid4()); n["created_at"] = now_iso(); n["updated_at"] = now_iso()
    await mysql_doc_insert_many("notifications", notes)

    # Blogs
    blogs = [
        {"title": "Top 10 Road Trips in the USA", "slug": "top-10-road-trips-usa", "category": "Travel",
        "tags": ["roadtrip", "usa", "travel"], "content": "Discover stunning routes...",
        "seo_title": "Top 10 USA Road Trips", "seo_description": "Best road trips to take in the USA",
        "cover_image": None, "is_published": True, "author": "Admin"},
        {"title": "How to Choose the Right Rental Car", "slug": "choose-rental-car", "category": "Guides",
        "tags": ["rental", "guide"], "content": "When choosing a rental car, consider...",
        "seo_title": "Rental Car Buying Guide", "seo_description": "Complete guide for choosing the right rental car",
        "cover_image": None, "is_published": True, "author": "Admin"},
    ]
    for b in blogs:
        b["id"] = str(uuid.uuid4()); b["created_at"] = now_iso(); b["updated_at"] = now_iso()
    await mysql_doc_insert_many("blogs", blogs)

    # Testimonials (marketing quotes — optional seed)
    testimonials_seed = [
        {
            "name": "Sarah M.",
            "role": "Business Traveler",
            "testimonial": "NOVACAR RENTALS made my business trip effortless. The vehicle was clean, comfortable, and in excellent condition. Their customer service was outstanding, and the booking process was quick and easy. I highly recommend them.",
            "profile_image": None,
            "rating": 5,
            "display_order": 0,
            "is_visible": True,
        },
        {
            "name": "David K.",
            "role": "Safari Tourist",
            "testimonial": "We rented a 4x4 for our safari in Rwanda, and the experience exceeded our expectations. The vehicle was reliable, well-maintained, and perfect for the journey. The staff were friendly and professional from start to finish.",
            "profile_image": None,
            "rating": 5,
            "display_order": 1,
            "is_visible": True,
        },
        {
            "name": "Grace N.",
            "role": "Family Vacation",
            "testimonial": "Our family rented an SUV for a cross-border trip, and everything went smoothly. The car was spotless, fuel-efficient, and very comfortable. NOVACAR RENTALS provided excellent service, transparent pricing, and great support throughout our trip.",
            "profile_image": None,
            "rating": 5,
            "display_order": 2,
            "is_visible": True,
        },
    ]
    for t in testimonials_seed:
        t["id"] = str(uuid.uuid4())
        t["created_at"] = now_iso()
        t["updated_at"] = now_iso()
    await mysql_doc_insert_many("testimonials", testimonials_seed)

    # CMS Pages
    cms = [
        {"key": "about", "title": "About EliteRide", "content": "EliteRide is a premium car rental service...", "is_published": True},
        {"key": "service", "title": "Our Services", "content": "We offer luxury sedans, SUVs, sports cars...", "is_published": True},
        {"key": "contact", "title": "Contact Us", "content": "Reach us at hello@eliteride.com", "is_published": True},
        {"key": "faq", "title": "Frequently Asked Questions", "content": "Q: What documents do I need? A: A valid driver's license...", "is_published": True},
        {"key": "privacy", "title": "Privacy Policy", "content": "We respect your privacy...", "is_published": True},
        {"key": "terms", "title": "Terms & Conditions", "content": "By using EliteRide, you agree...", "is_published": True},
    ]
    for c in cms:
        c["id"] = str(uuid.uuid4()); c["seo_title"] = None; c["seo_description"] = None
        c["created_at"] = now_iso(); c["updated_at"] = now_iso()
    await mysql_doc_insert_many("cms_pages", cms)

    logger.info("Demo data seeded.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await mysql_init_schema()
        await mysql_repair_all_document_tables()
        await seed_admin()
        await seed_demo_data()
        await mysql_ensure_default_vehicle_categories()
        await mysql_ensure_default_cms_pages()
    except PyMySQLOperationalError as e:
        logger.exception(
            "MySQL connection failed (check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, "
            "MYSQL_DATABASE or DB_NAME; ensure the database exists and the user can connect from this host)"
        )
        raise
    except RuntimeError:
        raise
    except Exception:
        logger.exception("Database startup failed during schema or seed")
        raise
    try:
        LOCAL_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
        IMAGE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Local uploads directory: %s", LOCAL_UPLOAD_ROOT.resolve())
    except OSError as e:
        logger.error("Cannot create local uploads dir %s: %s", LOCAL_UPLOAD_ROOT, e)
    init_storage()
    yield
    await mysql_close()

app = _PassengerSafeFastAPI(title="Car Rental Super Admin API", lifespan=lifespan)

# Register CORS before mounting routes so preflight (OPTIONS) and all /api responses get ACAO headers.
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
    **_cors_middleware_kwargs(),
)
# Last registered runs first / sees responses last — adds ACAO when upstream stripped it.
app.add_middleware(EnsureCORSMiddleware)


def _server_listen_config() -> Dict[str, Any]:
    host = (os.environ.get("HOST") or os.environ.get("BIND", "") or "0.0.0.0").strip()
    port = int(os.environ.get("PORT", "8000"))
    return {"host": host, "port": port}


def _local_ipv4_candidates() -> List[str]:
    """Best-effort LAN / routable IPv4s for this machine (no extra packages)."""
    seen: set = set()
    ordered: List[str] = []
    # Typical default-route interface (works when outbound UDP is allowed)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.25)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and ip not in seen:
            seen.add(ip)
            ordered.append(ip)
    except OSError:
        pass
    try:
        hn = socket.gethostname()
        for info in socket.getaddrinfo(hn, None, socket.AF_INET, socket.SOCK_STREAM):
            addr = info[4][0]
            if addr.startswith("127."):
                continue
            if addr not in seen:
                seen.add(addr)
                ordered.append(addr)
    except OSError:
        pass
    loop = "127.0.0.1"
    if loop not in seen:
        ordered.append(loop)
    return ordered


@app.get("/", include_in_schema=False)
async def root(request: Request):
    """Running server info: bind address, detected IPs, and entry URLs (API under /api)."""
    listen = _server_listen_config()
    port = listen["port"]
    ips = _local_ipv4_candidates()
    base_urls: List[str] = []
    for ip in ips:
        u = f"http://{ip}:{port}/"
        if u not in base_urls:
            base_urls.append(u)
    # What this HTTP request used (works behind reverse proxies if Forwarded headers are set)
    try:
        this_url = str(request.base_url).rstrip("/") + "/"
    except Exception:
        this_url = None
    forwarded = (request.headers.get("x-forwarded-host") or request.headers.get("host") or "").strip()
    public_base = None
    if forwarded:
        scheme = (request.headers.get("x-forwarded-proto") or request.url.scheme or "http").split(",")[0].strip()
        public_base = f"{scheme}://{forwarded.split(',')[0].strip()}/"

    return {
        "service": "Car Rental Super Admin API",
        "status": "running",
        "listen": listen,
        "ip_addresses": ips,
        "urls": {"home": base_urls, "local_only": f"http://127.0.0.1:{port}/"},
        "this_request": {"base_url": this_url, "as_seen_publicly": public_base},
        "openapi": "/openapi.json",
        "docs": "/docs",
        "redoc": "/redoc",
        "api": "/api",
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon_placeholder():
    """Avoid 404 noise when browsers request a favicon from the API origin."""
    return Response(status_code=204)


@app.get("/.well-known/appspecific/com.chrome.devtools.json", include_in_schema=False)
async def chrome_devtools_wellknown():
    """Chrome DevTools probes this path; harmless empty reply."""
    return Response(status_code=204)


# ---------- Mount ----------
app.include_router(api_router)

# ---------- WSGI (LiteSpeed Passenger / cPanel — see passenger_wsgi.py) ----------
# `_PassengerSafeFastAPI` routes mistaken WSGI calls to `app` through a2wsgi; still prefer
# `application` / passenger_wsgi.py so you do not depend on subclass behavior.
def _wsgi_install_a2wsgi_help(environ, start_response):
    """Used when importing this module exposes `application` but a2wsgi is absent."""
    return _missing_a2wsgi_wsgi_handler(environ, start_response)


try:
    from a2wsgi import ASGIMiddleware

    _asgi_for_wsgi = app
    application = ASGIMiddleware(_asgi_for_wsgi)
    wsgi = application  # alias: some hosting docs use `wsgi`
    wsgi_application = application  # alias: Django-style name seen in some panels
except ImportError:  # pragma: no cover
    logger.error(
        "a2wsgi is not installed — WSGI/Passenger cannot run this API. pip install a2wsgi"
    )
    application = _wsgi_install_a2wsgi_help
    wsgi = application
    wsgi_application = application

if __name__ == "__main__":
    import uvicorn

    host = (os.environ.get("HOST") or os.environ.get("BIND", "") or "0.0.0.0").strip()
    port = int(os.environ.get("PORT", "8000"))
    logger.info("Starting API at http://%s:%s (API routes under /api)", host, port)
    uvicorn.run("server:app", host=host, port=port)
