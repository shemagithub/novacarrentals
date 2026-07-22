import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { resolveRouteSeo } from "@/lib/page-seo";
import { applyPageSeoToDocument } from "@/lib/seo";
import { getMarketingSiteOrigin } from "@/lib/site-url";

/** Updates document meta tags, canonical URL, and JSON-LD on every marketing route change. */
export function RouteSeo() {
  const [location] = useLocation();
  const { branding, globalSeo, cmsSeoMap, siteName, logoSrc } = useSiteSettings();

  const siteOrigin = useMemo(() => getMarketingSiteOrigin(branding), [branding]);

  useEffect(() => {
    const pageSeo = resolveRouteSeo(location, cmsSeoMap, globalSeo, siteName);
    const canonical = siteOrigin ? `${siteOrigin}${location.startsWith("/") ? location : `/${location}`}` : undefined;
    applyPageSeoToDocument(
      { ...pageSeo, canonical: pageSeo.canonical || canonical },
      {
        global: globalSeo,
        logoSrc,
        siteName,
        siteOrigin,
        pathname: location,
        branding,
      },
    );
  }, [location, cmsSeoMap, globalSeo, siteName, logoSrc, branding, siteOrigin]);

  return null;
}
