import type { LucideIcon } from "lucide-react";
import { Shield, Heart, Globe, Zap } from "lucide-react";
import type { PublicBranding, PublicCmsPage } from "@/lib/api";
import { SERVICE_ICONS, type ServiceIconKey, type ServiceItem } from "@/lib/services-data";
import type { DestinationCountry } from "@/lib/destinations-data";

export const HOME_QUERY_KEY = ["cms-home"] as const;
export const HOME_ABOUT_QUERY_KEY = ["cms-about-home"] as const;

export const VALUE_ICONS: LucideIcon[] = [Shield, Heart, Globe, Zap];

export interface HomeHero {
  badge: string;
  headline: string;
  headlineAccent: string;
  sub: string;
  subHtml: string | null;
  imageUrl: string | null;
  imageAlt: string;
}

export interface HomeStat {
  label: string;
  value: string;
}

export interface HomeServicesSection {
  eyebrow: string;
  headline: string;
  items: ServiceItem[];
}

export interface HomeWhySection {
  eyebrow: string;
  headline: string;
  sub: string;
  values: { title: string; description: string }[];
}

export interface HomeDestinationsSection {
  eyebrow: string;
  headline: string;
  sub: string;
  bullets: string[];
  imageUrl: string | null;
  crossBorderTitle: string;
  crossBorderDescription: string;
}

export interface HomeGuidesSection {
  eyebrow: string;
  headline: string;
  sub: string;
  subHtml: string | null;
}

export interface HomePromiseSection {
  headline: string;
  sub: string;
  bookLabel: string;
  fleetLabel: string;
}

export interface ResolvedHomeContent {
  hero: HomeHero;
  stats: HomeStat[];
  services: HomeServicesSection;
  why: HomeWhySection;
  destinations: HomeDestinationsSection;
  guides: HomeGuidesSection;
  promise: HomePromiseSection;
}

function mapApiService(row: {
  icon: string;
  title: string;
  tagline: string;
  description: string;
  perks: string[];
  cta_text: string;
  display_order?: number;
}): ServiceItem {
  const iconKeys: ServiceIconKey[] = ["car", "user-check", "plane", "building", "camera", "calendar"];
  const icon = (iconKeys.includes(row.icon as ServiceIconKey) ? row.icon : "car") as ServiceIconKey;
  return {
    icon,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    perks: row.perks ?? [],
    ctaText: row.cta_text || "Learn More",
    displayOrder: row.display_order ?? 0,
  };
}

function mapApiCountry(row: {
  name: string;
  tagline?: string;
  cities?: string[];
  cover_image_url?: string | null;
}): DestinationCountry {
  return {
    name: row.name,
    tagline: row.tagline || "",
    description: "",
    icon: "mountain",
    cities: row.cities ?? [],
    parks: [],
    imgBg: "",
    coverImageUrl: row.cover_image_url ?? null,
  };
}

function countryBullet(c: DestinationCountry): string {
  const cities = c.cities.slice(0, 4).join(", ");
  return cities ? `${c.name} — ${cities}` : c.name;
}

function resolveHeroImage(
  branding: PublicBranding | null,
  cmsHome: PublicCmsPage | null | undefined,
  destinations: PublicCmsPage | null | undefined,
): string | null {
  if (cmsHome?.published && cmsHome.hero_image_url?.trim()) {
    return cmsHome.hero_image_url.trim();
  }
  const og = branding?.seo?.og_image_url?.trim();
  if (og) {
    if (og.startsWith("http://") || og.startsWith("https://") || og.startsWith("/")) return og;
    return `/api/files/${og.replace(/^\//, "")}`;
  }
  const cover = destinations?.destination_countries?.find((c) => c.cover_image_url?.trim())?.cover_image_url;
  if (cover?.trim()) return cover.trim();
  return null;
}

function splitHeadline(title: string): { main: string; accent: string } {
  const parts = title.split("\n").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { main: parts[0], accent: parts.slice(1).join(" ") };
  }
  const words = title.trim().split(/\s+/);
  if (words.length >= 3) {
    const accent = words.slice(-2).join(" ");
    return { main: words.slice(0, -2).join(" "), accent };
  }
  return { main: title, accent: "" };
}

export function resolveHomeContent(input: {
  branding: PublicBranding | null;
  siteName: string;
  cmsHome: PublicCmsPage | null | undefined;
  cmsAbout: PublicCmsPage | null | undefined;
  cmsServices: PublicCmsPage | null | undefined;
  cmsDestinations: PublicCmsPage | null | undefined;
  cmsGuides: PublicCmsPage | null | undefined;
  fleetCount: number;
  t: (key: string) => string;
}): ResolvedHomeContent {
  const { branding, siteName, cmsHome, cmsAbout, cmsServices, cmsDestinations, cmsGuides, fleetCount, t } = input;

  const homePublished = cmsHome?.published;
  const aboutPublished = cmsAbout?.published;
  const servicesPublished = cmsServices?.published;
  const destinationsPublished = cmsDestinations?.published;
  const guidesPublished = cmsGuides?.published;

  const heroTitleRaw =
    (homePublished && cmsHome?.title?.trim()) ||
    (homePublished && cmsHome?.seo_title?.trim()) ||
    `${t("hero_headline_1")} ${t("hero_headline_2")}`.trim();
  const { main: headline, accent: headlineAccent } = splitHeadline(heroTitleRaw);

  const heroSubHtml =
    homePublished && cmsHome?.content?.trim() && /<[a-z][\s\S]*>/i.test(cmsHome.content)
      ? cmsHome.content
      : null;
  const heroSub =
    (homePublished && cmsHome?.content?.trim() && !heroSubHtml ? cmsHome.content : null) ||
    branding?.company?.description?.trim() ||
    branding?.footer_description?.trim() ||
    t("hero_sub");

  const hero: HomeHero = {
    badge:
      (homePublished && cmsHome?.hero_eyebrow?.trim()) ||
      branding?.footer_tagline?.trim() ||
      t("hero_badge"),
    headline: headline || t("hero_headline_1"),
    headlineAccent: headlineAccent || t("hero_headline_2"),
    sub: heroSub,
    subHtml: heroSubHtml,
    imageUrl: resolveHeroImage(branding, cmsHome, cmsDestinations),
    imageAlt: `${siteName} — East Africa car rental`,
  };

  let stats: HomeStat[] =
    aboutPublished && cmsAbout?.stats?.length
      ? cmsAbout.stats.filter((s) => s.label?.trim() && s.value?.trim())
      : [];

  stats = stats.map((s) => {
    if (fleetCount > 0 && /vehicle|fleet/i.test(s.label)) {
      return { ...s, value: `${fleetCount}+` };
    }
    if (destinationsPublished && cmsDestinations?.destination_countries?.length && /countr/i.test(s.label)) {
      return { ...s, value: String(cmsDestinations.destination_countries.length) };
    }
    return s;
  });

  const serviceItems: ServiceItem[] =
    servicesPublished && cmsServices?.service_items?.length
      ? [...cmsServices.service_items.map(mapApiService)].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        )
      : [];

  const services: HomeServicesSection = {
    eyebrow:
      (servicesPublished && cmsServices?.hero_eyebrow?.trim()) || t("services_label"),
    headline:
      (servicesPublished && cmsServices?.title?.trim()?.replace(/\n/g, " ")) || t("services_headline"),
    items: serviceItems.slice(0, 6),
  };

  const whyValues =
    aboutPublished && cmsAbout?.values?.length
      ? cmsAbout.values.filter((v) => v.title?.trim() && v.description?.trim())
      : [];

  const why: HomeWhySection = {
    eyebrow: t("why_label"),
    headline: (aboutPublished && cmsAbout?.story_title?.trim()) || t("why_headline"),
    sub:
      (aboutPublished && cmsAbout?.story_quote?.trim()) ||
      branding?.footer_description?.trim() ||
      t("why_sub"),
    values: whyValues.slice(0, 6),
  };

  const countries: DestinationCountry[] =
    destinationsPublished && cmsDestinations?.destination_countries?.length
      ? [...cmsDestinations.destination_countries.map(mapApiCountry)]
      : [];

  const destinations: HomeDestinationsSection = {
    eyebrow: (destinationsPublished && cmsDestinations?.hero_eyebrow?.trim()) || t("dest_label"),
    headline:
      (destinationsPublished && cmsDestinations?.title?.trim()) ||
      t("dest_headline").replace(/\./g, ".\n").split("\n")[0],
    sub:
      (destinationsPublished && cmsDestinations?.content?.trim()) || t("dest_sub"),
    bullets: countries.slice(0, 3).map(countryBullet),
    imageUrl:
      countries.find((c) => c.coverImageUrl)?.coverImageUrl ||
      cmsAbout?.story_image_rw_url ||
      null,
    crossBorderTitle:
      (destinationsPublished && cmsDestinations?.cross_border_title?.trim()) || "",
    crossBorderDescription:
      (destinationsPublished && cmsDestinations?.cross_border_description?.trim()) || "",
  };

  const guides: HomeGuidesSection = {
    eyebrow: (guidesPublished && cmsGuides?.hero_eyebrow?.trim()) || "Travel Guides",
    headline: (guidesPublished && cmsGuides?.title?.trim()) || "",
    sub: guidesPublished && cmsGuides?.content?.trim() && !/<[a-z][\s\S]*>/i.test(cmsGuides.content)
      ? cmsGuides.content.trim()
      : "",
    subHtml:
      guidesPublished && cmsGuides?.content?.trim() && /<[a-z][\s\S]*>/i.test(cmsGuides.content)
        ? cmsGuides.content
        : null,
  };

  const promise: HomePromiseSection = {
    headline:
      (servicesPublished && cmsServices?.bottom_cta_title?.trim()) ||
      (aboutPublished && cmsAbout?.cta_title?.trim()) ||
      t("promise_headline"),
    sub:
      (servicesPublished && cmsServices?.bottom_cta_description?.trim()) ||
      (aboutPublished && cmsAbout?.cta_description?.trim()) ||
      t("promise_sub"),
    bookLabel:
      (servicesPublished && cmsServices?.bottom_cta_button?.trim()) || t("promise_book"),
    fleetLabel: t("promise_fleet"),
  };

  return { hero, stats, services, why, destinations, guides, promise };
}

export { SERVICE_ICONS };
