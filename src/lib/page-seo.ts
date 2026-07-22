import type { PublicBrandingSeo } from "@/lib/api";
import type { CmsPageSeoEntry } from "@/lib/api";
import { formatPageTitle, truncateDescription, type PageSeoInput } from "@/lib/seo";

/** CMS keys for static marketing routes (editable in admin → Page SEO). */
export const ROUTE_CMS_KEYS: Record<string, string> = {
  "/": "home",
  "/fleet": "fleet",
  "/services": "service",
  "/destinations": "destinations",
  "/about": "about",
  "/contact": "contact",
  "/guides": "guides",
  "/blogs": "blogs",
};

const STATIC_FALLBACKS: Record<string, { title: string; description: string }> = {
  home: {
    title: "Home",
    description: "Premium car rentals across Rwanda, Uganda, and Tanzania.",
  },
  fleet: {
    title: "Our Fleet",
    description: "Browse safari 4x4s, executive sedans, and group vans for East Africa.",
  },
  service: {
    title: "Our Services",
    description: "Self-drive, chauffeur-driven, airport transfers, and corporate fleet solutions.",
  },
  destinations: {
    title: "Destinations",
    description: "Explore Rwanda, Uganda, and Tanzania with a vehicle matched to every road.",
  },
  about: {
    title: "About Us",
    description: "Learn about Nova Car Rentals and our commitment to safe, reliable travel.",
  },
  contact: {
    title: "Contact",
    description: "Get in touch for quotes, bookings, and 24/7 roadside support.",
  },
  guides: {
    title: "Travel Guides",
    description: "Expert driving guides for Kigali, Serengeti, Kampala, and beyond.",
  },
  blogs: {
    title: "Blog",
    description: "Travel tips, safari insights, and East Africa driving advice from NovaCar.",
  },
};

function cmsEntryToPageSeo(
  entry: CmsPageSeoEntry | undefined,
  fallbackKey: string,
  siteName: string,
  global: PublicBrandingSeo,
): PageSeoInput {
  const fb = STATIC_FALLBACKS[fallbackKey] ?? STATIC_FALLBACKS.home;
  const pageTitle = (entry?.seo_title || entry?.title || fb.title).trim();
  const description = truncateDescription(
    (entry?.seo_description || fb.description || global.description).trim(),
  );
  return {
    title: formatPageTitle(pageTitle, siteName),
    description,
  };
}

export function resolveRouteSeo(
  pathname: string,
  cmsMap: Record<string, CmsPageSeoEntry>,
  global: PublicBrandingSeo,
  siteName: string,
): PageSeoInput {
  const path = pathname.replace(/\/$/, "") || "/";
  const baseSite = siteName.trim() || global.title;

  const fleetMatch = path.match(/^\/fleet\/([^/]+)$/);
  if (fleetMatch) {
    return {
      title: formatPageTitle("Vehicle Details", baseSite),
      description: truncateDescription(global.description),
    };
  }

  const guideMatch = path.match(/^\/guides\/([^/]+)$/);
  if (guideMatch) {
    return {
      title: formatPageTitle("Travel Guide", baseSite),
      description: truncateDescription(global.description),
    };
  }

  const blogMatch = path.match(/^\/blogs\/([^/]+)$/);
  if (blogMatch) {
    return {
      title: formatPageTitle("Blog", baseSite),
      description: truncateDescription(global.description),
    };
  }

  const cmsKey = ROUTE_CMS_KEYS[path];
  if (cmsKey) {
    return cmsEntryToPageSeo(cmsMap[cmsKey], cmsKey, baseSite, global);
  }

  return {
    title: formatPageTitle("Page Not Found", baseSite),
    description: truncateDescription(global.description),
  };
}
