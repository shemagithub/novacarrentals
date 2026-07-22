import { useEffect, useRef } from "react";

/**
 * Milliseconds between automatic admin UI refreshes (lists, dashboard, reports).
 * - Unset: default 4000 (4s).
 * - `REACT_APP_ADMIN_POLL_MS=0` disables polling.
 * - Clamped between 2000 and 120000 when enabled.
 */
export function getAdminPollIntervalMs() {
  const raw = process.env.REACT_APP_ADMIN_POLL_MS;
  if (raw != null && String(raw).trim() === "0") return 0;
  const parsed =
    raw == null || String(raw).trim() === "" ? 4000 : Number(String(raw).trim());
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  if (parsed === 0) return 0;
  return Math.min(120000, Math.max(2000, Math.floor(parsed)));
}

/**
 * Runs `callback` on an interval while the document is visible, and once when the tab becomes visible again.
 * No-op when `getAdminPollIntervalMs()` is 0.
 *
 * @param {() => void} callback
 * @param {import('react').DependencyList} deps Same rules as `useEffect` — include any values the callback closes over.
 */
export function useAdminBackgroundPoll(callback, deps) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const ms = getAdminPollIntervalMs();
    if (!ms) return undefined;

    const run = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      cbRef.current();
    };

    const id = setInterval(run, ms);
    const onVis = () => {
      if (!document.hidden) cbRef.current();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirror `useEffect(fn, deps)`; caller supplies `deps`
  }, deps);
}
