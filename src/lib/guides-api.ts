import { API_BASE } from "@/lib/api";

export const GUIDES_QUERY_KEY = ["public-travel-guides"] as const;

export interface GuideSection {
  heading: string;
  body: string;
  tip?: string;
  imageUrl?: string | null;
}

export interface RecommendedVehicle {
  id: string;
  name: string;
  reason: string;
  dailyRate?: number | null;
}

export interface Guide {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  country: string;
  flag: string;
  readTime: string;
  coverGradient: string;
  accentColor: string;
  tags: string[];
  intro: string;
  sections: GuideSection[];
  recommendedVehicles: RecommendedVehicle[];
  practicalInfo: { label: string; value: string }[];
  bestMonths: string;
  difficulty: string;
  ctaText: string;
}

export interface ApiTravelGuide {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  country: string;
  flag: string;
  read_time: string;
  cover_gradient: string;
  cover_image_url?: string | null;
  card_image_url?: string | null;
  gallery_image_urls?: string[] | null;
  accent_color: string;
  tags: string[];
  intro: string;
  sections?: { heading: string; body: string; tip?: string | null; image_url?: string | null }[];
  recommended_vehicles?: {
    id: string;
    name: string;
    reason: string;
    daily_rate?: number | null;
  }[];
  practical_info?: { label: string; value: string }[];
  best_months: string;
  difficulty: string;
  cta_text?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  display_order?: number;
  updated_at?: string | null;
}

export type DisplayGuide = Guide & {
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  galleryImageUrls?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function guidePlainText(content: string): string {
  const raw = (content || "").trim();
  if (!raw) return "";
  if (isGuideHtml(raw)) {
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return raw;
}

export function guideListExcerpt(guide: Pick<Guide, "subtitle" | "intro">, maxLen = 220): string {
  const subtitle = guidePlainText(guide.subtitle);
  if (subtitle) return subtitle.length > maxLen ? `${subtitle.slice(0, maxLen).trim()}…` : subtitle;
  const intro = guidePlainText(guide.intro);
  if (!intro) return "";
  return intro.length > maxLen ? `${intro.slice(0, maxLen).trim()}…` : intro;
}

export function mapApiGuide(g: ApiTravelGuide): DisplayGuide {
  return {
    slug: g.slug,
    title: g.title,
    subtitle: g.subtitle,
    category: g.category,
    country: g.country,
    flag: g.flag,
    readTime: g.read_time || "5 min read",
    coverGradient: g.cover_gradient || "from-emerald-950 via-green-900 to-emerald-800",
    coverImageUrl: g.cover_image_url ?? null,
    cardImageUrl: g.card_image_url ?? g.cover_image_url ?? null,
    galleryImageUrls: g.gallery_image_urls ?? [],
    accentColor: g.accent_color || "text-emerald-400",
    tags: Array.isArray(g.tags) ? g.tags : [],
    intro: g.intro || "",
    sections: (g.sections ?? []).map((s) => ({
      heading: s.heading,
      body: s.body,
      tip: s.tip ?? undefined,
      imageUrl: s.image_url ?? null,
    })),
    recommendedVehicles: (g.recommended_vehicles ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      reason: v.reason,
      dailyRate: v.daily_rate ?? null,
    })),
    practicalInfo: (g.practical_info ?? []).map((p) => ({
      label: p.label,
      value: p.value,
    })),
    bestMonths: g.best_months || "",
    difficulty: g.difficulty || "Moderate",
    ctaText: g.cta_text || "Book your vehicle for this journey",
    seoTitle: g.seo_title ?? null,
    seoDescription: g.seo_description ?? null,
  };
}

export async function fetchPublicTravelGuides(limit = 50): Promise<DisplayGuide[]> {
  const res = await fetch(`${API_BASE}/public/travel-guides?limit=${limit}`, { credentials: "omit" });
  if (!res.ok) {
    throw new Error(`Failed to load travel guides (${res.status})`);
  }
  const data = (await res.json()) as ApiTravelGuide[];
  return Array.isArray(data) ? data.map(mapApiGuide) : [];
}

export async function fetchPublicTravelGuideBySlug(slug: string): Promise<DisplayGuide | null> {
  const key = slug.trim();
  if (!key) return null;
  const res = await fetch(`${API_BASE}/public/travel-guides/${encodeURIComponent(key)}`, {
    credentials: "omit",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load travel guide (${res.status})`);
  }
  return mapApiGuide((await res.json()) as ApiTravelGuide);
}

export function guideCategoriesFrom(guideList: Guide[]): string[] {
  return [...new Set(guideList.map((g) => g.category).filter(Boolean))];
}

export function isGuideHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function guideSeoDescription(guide: DisplayGuide): string {
  const raw = guide.seoDescription?.trim() || guide.intro || guide.subtitle || "";
  return guidePlainText(raw);
}
