import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { applyPageSeoToDocument, type PageSeoInput } from "@/lib/seo";
import { getMarketingSiteOrigin, absoluteMarketingUrl } from "@/lib/site-url";

/** Apply page-specific SEO (vehicle, blog, CMS pages) after async data loads. */
export function useDynamicPageSeo(pageSeo: PageSeoInput | null) {
  const [location] = useLocation();
  const { globalSeo, logoSrc, siteName, branding } = useSiteSettings();

  useEffect(() => {
    if (!pageSeo) return;
    const siteOrigin = getMarketingSiteOrigin(branding);
    applyPageSeoToDocument(
      {
        ...pageSeo,
        canonical: pageSeo.canonical || (siteOrigin ? absoluteMarketingUrl(siteOrigin, location) : undefined),
      },
      {
        global: globalSeo,
        logoSrc,
        siteName,
        siteOrigin,
        pathname: location,
        branding,
      },
    );
  }, [pageSeo, globalSeo, logoSrc, siteName, branding, location]);
}
