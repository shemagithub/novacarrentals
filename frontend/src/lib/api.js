import axios from "axios";

function trimBackendUrl(raw) {
  if (raw == null || String(raw).trim() === "") return "";
  return String(raw).trim().replace(/\/$/, "");
}

/**
 * API origin for axios (`API_BASE` = `${BACKEND_URL}/api`).
 *
 * - If `REACT_APP_BACKEND_URL` is set (e.g. in `.env.development`), it is used in **all** environments,
 *   including `npm start` on localhost — requests go straight to that host (CORS must allow your dev origin).
 * - If it is **empty** on localhost in development, use same-origin `/api` and the dev-server proxy
 *   (`REACT_APP_API_PROXY_TARGET` in `craco.config.js`) for a local FastAPI without CORS setup.
 *
 * Production builds typically set `REACT_APP_BACKEND_URL` in `.env.production`.
 */
function normalizeBackendUrl(raw) {
  const s = trimBackendUrl(raw);
  if (s) return s;

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const host = window.location.hostname;
    const isLocalDevHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".localhost");
    if (isLocalDevHost) {
      return "";
    }
  }

  return "";
}

const BACKEND_URL = normalizeBackendUrl(process.env.REACT_APP_BACKEND_URL);

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

/** Admin UI auto-refresh interval: `REACT_APP_ADMIN_POLL_MS` (see `adminPoll.js`). */

/**
 * Build an <img src> for files served under /api/files/... (requires ?auth= for browser requests).
 * Accepts stored values like `/api/files/carrental/blogs/...`, `carrental/blogs/...`, or absolute URLs.
 */
export function fileImageSrcFromStored(stored) {
  if (stored == null || String(stored).trim() === "") return "";
  const s = String(stored).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s.includes("/api/files/") ? appendFileAuthQuery(s) : s;
  }
  let path = s;
  if (!path.startsWith("/api/files/")) {
    path = `/api/files/${path.replace(/^\//, "")}`;
  }
  const absolute = BACKEND_URL ? `${BACKEND_URL}${path}` : path;
  return appendFileAuthQuery(absolute);
}

function appendFileAuthQuery(url) {
  if (!url || !String(url).includes("/api/files/")) return url;
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}auth=${encodeURIComponent(token)}`;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

/** Full axios error → user-facing login / form message (handles empty body on 503/502). */
export function formatAxiosError(err) {
  const body = err?.response?.data;
  const detail = body?.detail;
  if (detail != null && String(detail).trim() !== "") {
    return formatApiErrorDetail(detail);
  }
  const status = err?.response?.status;
  if (status === 503) {
    return "The API can't serve login right now (usually MySQL unreachable from the server or JWT_SECRET missing in the backend .env). Fix hosting env for backend.novacarrentals.com - the React app cannot override that.";
  }
  if (status === 502 || status === 504) {
    return "Bad gateway — the dev proxy or upstream API failed. Check REACT_APP_API_PROXY_TARGET or try again.";
  }
  if (!err?.response && err?.request) {
    return "No response from the server. Check VPN/network or that the API URL is correct.";
  }
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return "Something went wrong. Please try again.";
}

export default api;
