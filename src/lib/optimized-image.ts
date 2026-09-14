/** Append a max-width hint so the API can serve a compressed image. */
export function withImageWidth(src: string, width: number): string {
  const raw = (src || "").trim();
  if (!raw || raw.startsWith("data:") || /\.svg(\?|$)/i.test(raw)) return raw;
  try {
    const absolute = /^https?:\/\//i.test(raw);
    const u = new URL(raw, "https://novacar.local");
    u.searchParams.set("w", String(width));
    if (absolute) return u.toString();
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}w=${width}`;
  }
}
