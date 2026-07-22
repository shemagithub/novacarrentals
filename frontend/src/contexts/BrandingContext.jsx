import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { API_BASE } from "@/lib/api";

const BrandingContext = createContext(null);

const FALLBACK = {
  company_name: "NovaCar Admin",
  logo_url: null,
  currency: "USD",
  updated_at: null,
  social_links: {},
};

export function BrandingProvider({ children }) {
  const [company_name, setCompanyName] = useState(FALLBACK.company_name);
  const [logo_url, setLogoUrl] = useState(FALLBACK.logo_url);
  const [currency, setCurrency] = useState(FALLBACK.currency);
  const [updated_at, setUpdatedAt] = useState(FALLBACK.updated_at);
  const [social_links, setSocialLinks] = useState(FALLBACK.social_links);
  const [loading, setLoading] = useState(true);

  const refreshBranding = useCallback(async () => {
    try {
      const { data } = await api.get("/branding");
      const c = data.currency === "RWF" ? "RWF" : "USD";
      setCompanyName(data.company_name?.trim() || FALLBACK.company_name);
      setLogoUrl(data.logo_url || null);
      setCurrency(c);
      setUpdatedAt(data.updated_at || null);
      const sl = data.social_links;
      setSocialLinks(
        sl && typeof sl === "object" && !Array.isArray(sl) ? sl : FALLBACK.social_links,
      );
    } catch {
      setCompanyName(FALLBACK.company_name);
      setLogoUrl(null);
      setCurrency("USD");
      setUpdatedAt(null);
      setSocialLinks(FALLBACK.social_links);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const logoSrc = useMemo(() => {
    if (!logo_url?.trim()) return null;
    const u = logo_url.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    const q = updated_at ? `?t=${encodeURIComponent(updated_at)}` : "";
    return `${API_BASE}/public/branding-asset${q}`;
  }, [logo_url, updated_at]);

  /** Tab title + favicon from Settings (/api/branding → DB). index.html holds placeholders until this runs. */
  useEffect(() => {
    const name = (company_name || "").trim() || FALLBACK.company_name;
    document.title = `${name} · Super Admin`;
  }, [company_name]);

  useEffect(() => {
    let link = document.querySelector("link#branding-favicon");
    if (!link) {
      link = document.createElement("link");
      link.id = "branding-favicon";
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (logoSrc) {
      link.href = logoSrc;
      if (/\.svg(\?|$)/i.test(logoSrc)) link.type = "image/svg+xml";
      else if (/\.(png|webp|gif)(\?|$)/i.test(logoSrc)) link.type = "image/png";
      else link.removeAttribute("type");
    } else {
      link.type = "image/svg+xml";
      link.href =
        "data:image/svg+xml," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#E60000'/></svg>",
        );
    }
  }, [logoSrc]);

  const value = useMemo(
    () => ({
      company_name,
      logo_url,
      currency,
      updated_at,
      social_links,
      logoSrc,
      brandingLoading: loading,
      refreshBranding,
    }),
    [company_name, logo_url, currency, updated_at, social_links, logoSrc, loading, refreshBranding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
}
