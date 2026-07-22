import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  brandingLogoSrc,
  fetchCmsPagesSeo,
  fetchPublicBranding,
  type CmsPageSeoEntry,
  type PublicBranding,
  type PublicBrandingSeo,
} from "@/lib/api";
import { MARKETING_CURRENCY, type Currency } from "@/lib/formatMoney";

const FALLBACK_SEO: PublicBrandingSeo = {
  title: "Nova Car Rentals",
  description: "Premium car rentals across Rwanda, Uganda, and Tanzania.",
  robots: "index, follow",
  og_type: "website",
  og_image_url: "/opengraph.jpg",
  twitter_card: "summary_large_image",
  language: "en",
};

interface SiteSettingsContextValue {
  branding: PublicBranding | null;
  globalSeo: PublicBrandingSeo;
  cmsSeoMap: Record<string, CmsPageSeoEntry>;
  siteName: string;
  logoSrc: string | null;
  currency: Currency;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  branding: null,
  globalSeo: FALLBACK_SEO,
  cmsSeoMap: {},
  siteName: "Nova Car Rentals",
  logoSrc: null,
  currency: "USD",
  loading: true,
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [cmsSeoMap, setCmsSeoMap] = useState<Record<string, CmsPageSeoEntry>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPublicBranding(), fetchCmsPagesSeo()]).then(([brand, cms]) => {
      if (!cancelled) {
        setBranding(brand);
        setCmsSeoMap(cms);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const globalSeo = branding?.seo ?? FALLBACK_SEO;
  const siteName = (branding?.company_name || globalSeo.title || "Nova Car Rentals").trim();
  const logoSrc = brandingLogoSrc(branding?.logo_url, branding?.updated_at);
  const currency: Currency = MARKETING_CURRENCY;

  const value = useMemo(
    () => ({ branding, globalSeo, cmsSeoMap, siteName, logoSrc, currency, loading }),
    [branding, globalSeo, cmsSeoMap, siteName, logoSrc, currency, loading],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

/** @deprecated use useSiteSettings().globalSeo */
export function useSiteSeo() {
  const { globalSeo } = useSiteSettings();
  return globalSeo;
}
