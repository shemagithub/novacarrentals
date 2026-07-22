import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicCmsPage } from "@/lib/api";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";
import { formatPageTitle, truncateDescription } from "@/lib/seo";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Override route SEO with full CMS page fields when published. */
export function useCmsPageSeo(
  cmsKey: string,
  fallback: { title: string; description: string },
) {
  const { siteName, globalSeo } = useSiteSettings();
  const { data: cms } = useQuery({
    queryKey: ["cms-page-seo", cmsKey],
    queryFn: () => fetchPublicCmsPage(cmsKey),
    staleTime: 60_000,
  });

  const pageSeo = useMemo(() => {
    if (!cms?.published) return null;
    const rawTitle = cms.seo_title?.trim() || cms.title?.trim() || fallback.title;
    const rawDesc =
      cms.seo_description?.trim() ||
      (cms.content?.trim() ? stripHtml(cms.content) : "") ||
      fallback.description ||
      globalSeo.description;
    return {
      title: formatPageTitle(rawTitle, siteName || globalSeo.title),
      description: truncateDescription(rawDesc),
    };
  }, [cms, siteName, globalSeo, fallback.title, fallback.description]);

  useDynamicPageSeo(pageSeo);
  return cms;
}
