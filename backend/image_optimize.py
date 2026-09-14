"""Compress and resize marketing images so the public site loads faster."""
from __future__ import annotations

import hashlib
import io
import logging
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

_MAX_UPLOAD_EDGE = 1920
_DEFAULT_SERVE_EDGE = 1600
_JPEG_QUALITY = 80
_WEBP_QUALITY = 78
_ALLOWED_WIDTHS = (400, 640, 800, 1024, 1280, 1600, 1920)
_SKIP_TYPES = frozenset(
    {
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/octet-stream",
    }
)


def snap_image_width(width: Optional[int]) -> int:
    """Pick a cache-friendly width; default caps huge originals at 1600px."""
    if not width or width <= 0:
        return _DEFAULT_SERVE_EDGE
    w = int(width)
    for allowed in _ALLOWED_WIDTHS:
        if w <= allowed:
            return allowed
    return _ALLOWED_WIDTHS[-1]


def compress_uploaded_image(content: bytes, content_type: str) -> Tuple[bytes, str, str]:
    """Resize/re-encode uploads. Tiny PNGs keep PNG so admin tests stay valid."""
    ct = (content_type or "").split(";")[0].strip().lower()
    ext_map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    if not ct.startswith("image/") or ct in _SKIP_TYPES:
        return content, content_type or ct, ext_map.get(ct, "bin")

    try:
        from PIL import Image, ImageOps
    except Exception:
        return content, content_type, ext_map.get(ct, "bin")

    try:
        im = Image.open(io.BytesIO(content))
        im = ImageOps.exif_transpose(im)
    except Exception:
        logger.debug("compress_uploaded_image: could not open image", exc_info=True)
        return content, content_type, ext_map.get(ct, "bin")

    im = _fit_longest(im, _MAX_UPLOAD_EDGE)
    has_alpha = _has_alpha(im)
    out = io.BytesIO()

    # Keep small opaque PNGs as PNG (icons / test fixtures). Large photos become JPEG.
    if ct == "image/png" and not has_alpha and len(content) < 100_000:
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.save(out, format="PNG", optimize=True)
        data = out.getvalue()
        return (data if len(data) < len(content) else content), "image/png", "png"

    if has_alpha:
        if im.mode != "RGBA":
            im = im.convert("RGBA")
        im.save(out, format="WEBP", quality=_WEBP_QUALITY, method=4)
        return out.getvalue(), "image/webp", "webp"

    if im.mode != "RGB":
        im = im.convert("RGB")
    im.save(out, format="JPEG", quality=_JPEG_QUALITY, optimize=True, progressive=True)
    data = out.getvalue()
    if ct in ("image/jpeg", "image/jpg") and len(data) >= len(content):
        return content, content_type, "jpg"
    return data, "image/jpeg", "jpg"


def prepare_public_image(
    data: bytes,
    content_type: str,
    *,
    storage_path: str = "",
    width: Optional[int] = None,
    cache_dir: Optional[Path] = None,
) -> Tuple[bytes, str]:
    """Return a resized, compressed image for public delivery (disk-cached)."""
    ct = (content_type or "").split(";")[0].strip().lower() or "application/octet-stream"
    if not ct.startswith("image/") or ct in _SKIP_TYPES or not data:
        return data, ct

    target = snap_image_width(width)
    cache_key = hashlib.sha1(
        f"{storage_path}|{len(data)}|{target}|v2".encode("utf-8", errors="replace")
    ).hexdigest()
    if cache_dir is not None:
        cached = _read_cache(cache_dir, cache_key)
        if cached:
            return cached

    try:
        body, out_ct = _resize_encode(data, target)
    except Exception:
        logger.debug("prepare_public_image: resize failed path=%s", storage_path, exc_info=True)
        return data, ct

    if cache_dir is not None:
        _write_cache(cache_dir, cache_key, body, out_ct)
    return body, out_ct


def _fit_longest(im, max_edge: int):
    w, h = im.size
    longest = max(w, h)
    if longest <= max_edge or max_edge <= 0:
        return im
    from PIL import Image

    scale = max_edge / float(longest)
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def _has_alpha(im) -> bool:
    if im.mode in ("RGBA", "LA"):
        return True
    if im.mode == "P" and "transparency" in im.info:
        return True
    return False


def _resize_encode(data: bytes, max_width: int) -> Tuple[bytes, str]:
    from PIL import Image, ImageOps

    im = Image.open(io.BytesIO(data))
    im = ImageOps.exif_transpose(im)
    w, h = im.size
    if w > max_width:
        nh = max(1, int(h * (max_width / float(w))))
        im = im.resize((max_width, nh), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    if _has_alpha(im):
        if im.mode != "RGBA":
            im = im.convert("RGBA")
        im.save(out, format="WEBP", quality=_WEBP_QUALITY, method=4)
        return out.getvalue(), "image/webp"

    if im.mode != "RGB":
        im = im.convert("RGB")
    im.save(out, format="JPEG", quality=_JPEG_QUALITY, optimize=True, progressive=True)
    return out.getvalue(), "image/jpeg"


def _read_cache(cache_dir: Path, key: str) -> Optional[Tuple[bytes, str]]:
    bin_path = cache_dir / f"{key}.bin"
    ct_path = cache_dir / f"{key}.ct"
    try:
        if bin_path.is_file() and ct_path.is_file():
            return bin_path.read_bytes(), ct_path.read_text(encoding="utf-8").strip()
    except OSError:
        return None
    return None


def _write_cache(cache_dir: Path, key: str, body: bytes, content_type: str) -> None:
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
        (cache_dir / f"{key}.bin").write_bytes(body)
        (cache_dir / f"{key}.ct").write_text(content_type, encoding="utf-8")
    except OSError:
        logger.debug("image cache write failed", exc_info=True)
