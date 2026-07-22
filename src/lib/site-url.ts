import type { PublicBranding } from "@/lib/api";

/** Public marketing site origin (https://example.com) for canonical URLs and JSON-LD. */
export function getMarketingSiteOrigin(branding: PublicBranding | null | undefined): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim();
  if (fromEnv) return normalizeOrigin(fromEnv);

  const fromBranding = branding?.company?.website_url?.trim();
  if (fromBranding) return normalizeOrigin(fromBranding);

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}

export function normalizeOrigin(raw: string): string {
  let u = (raw || "").trim().replace(/\/$/, "");
  if (!u) return "";
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = `https://${u}`;
  }
  return u;
}

/** Build absolute URL for a marketing path (e.g. /fleet → https://site.com/fleet). */
export function absoluteMarketingUrl(origin: string, pathname: string): string {
  const base = normalizeOrigin(origin);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!base) return path;
  return `${base}${path}`;
}

/** Resolve relative asset paths to absolute URLs for Open Graph / JSON-LD. */
export function absoluteAssetUrl(origin: string, raw: string | null | undefined): string {
  const candidate = (raw || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) return candidate;
  const base = normalizeOrigin(origin);
  if (candidate.startsWith("/")) {
    return base ? `${base}${candidate}` : candidate;
  }
  const path = candidate.includes("/api/files/")
    ? candidate.slice(candidate.indexOf("/api/files/"))
    : `/api/files/${candidate.replace(/^\//, "")}`;
  return base ? `${base}${path}` : path;
}
