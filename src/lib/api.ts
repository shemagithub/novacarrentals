function trimBackendUrl(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/\/$/, "");
}

/**
 * Marketing site API origin.
 * - Set VITE_BACKEND_URL in .env (e.g. https://backend.novacarrentals.com) for direct calls.
 * - Leave empty in dev to use Vite proxy → /api (see vite.config.ts).
 */
const BACKEND_URL = trimBackendUrl(import.meta.env.VITE_BACKEND_URL as string | undefined);

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export interface PublicBrandingSeo {
  title: string;
  description: string;
  robots: string;
  og_type: string;
  og_image_url: string;
  twitter_card: string;
  language: string;
}

export interface PublicCompanyInfo {
  phone: string | null;
  email: string | null;
  description: string | null;
  website_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface PublicBranding {
  company_name: string;
  logo_url: string | null;
  currency: string | null;
  updated_at: string | null;
  footer_tagline: string | null;
  footer_description: string | null;
  footer_credit_line: string | null;
  business_hours_text: string | null;
  social_links: Record<string, string>;
  company: PublicCompanyInfo;
  seo: PublicBrandingSeo;
}

export interface CmsPageSeoEntry {
  title: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export async function fetchPublicBranding(): Promise<PublicBranding | null> {
  try {
    const res = await fetch(`${API_BASE}/branding`, { credentials: "omit" });
    if (!res.ok) return null;
    return (await res.json()) as PublicBranding;
  } catch {
    return null;
  }
}

export async function fetchCmsPagesSeo(): Promise<Record<string, CmsPageSeoEntry>> {
  try {
    const res = await fetch(`${API_BASE}/public/cms-pages-seo`, { credentials: "omit" });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, CmsPageSeoEntry>;
  } catch {
    return {};
  }
}

export function brandingLogoSrc(logoUrl: string | null | undefined, updatedAt: string | null | undefined): string | null {
  if (!logoUrl?.trim()) return null;
  const u = logoUrl.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const q = updatedAt ? `?t=${encodeURIComponent(updatedAt)}` : "";
  return `${API_BASE}/public/branding-asset${q}`;
}

export interface PublicBlogSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  excerpt: string;
  author: string;
  cover_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PublicBlogPost extends PublicBlogSummary {
  content: string;
  seo_title: string | null;
  seo_description: string | null;
}

export async function fetchPublicBlogs(limit = 50): Promise<PublicBlogSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/public/blogs?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    return (await res.json()) as PublicBlogSummary[];
  } catch {
    return [];
  }
}

export async function fetchPublicBlogBySlug(slug: string): Promise<PublicBlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/public/blogs/${encodeURIComponent(slug)}`, {
      credentials: "omit",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicBlogPost;
  } catch {
    return null;
  }
}

export interface PublicCmsPage {
  key: string;
  published: boolean;
  title: string | null;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string | null;
  hero_eyebrow?: string | null;
  hero_image_url?: string | null;
  story_title?: string | null;
  story_content?: string | null;
  stats?: { label: string; value: string }[] | null;
  values?: { title: string; description: string }[] | null;
  promises?: string[] | null;
  cta_title?: string | null;
  cta_description?: string | null;
  story_image_rw_url?: string | null;
  story_image_ug_url?: string | null;
  story_image_tz_url?: string | null;
  story_quote?: string | null;
  destination_countries?: {
    name: string;
    tagline: string;
    description: string;
    icon: string;
    cities: string[];
    parks: { name: string; highlight: string }[];
    img_bg: string;
    cover_image_url?: string | null;
    display_order?: number;
  }[] | null;
  airports_eyebrow?: string | null;
  airports_title?: string | null;
  airports_intro?: string | null;
  destination_airports?: {
    city: string;
    country: string;
    code: string;
    airport: string;
  }[] | null;
  cross_border_eyebrow?: string | null;
  cross_border_title?: string | null;
  cross_border_description?: string | null;
  cross_border_button?: string | null;
  service_items?: {
    icon: string;
    title: string;
    tagline: string;
    description: string;
    perks: string[];
    cta_text: string;
    display_order?: number;
  }[] | null;
  perfect_for_eyebrow?: string | null;
  perfect_for_title?: string | null;
  perfect_for_items?: string[] | null;
  bottom_cta_title?: string | null;
  bottom_cta_description?: string | null;
  bottom_cta_button?: string | null;
}

export async function fetchPublicCmsPage(key: string): Promise<PublicCmsPage | null> {
  try {
    const res = await fetch(`${API_BASE}/public/cms-page/${encodeURIComponent(key)}`, {
      credentials: "omit",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicCmsPage;
  } catch {
    return null;
  }
}

export interface PublicTestimonial {
  id: string;
  name: string;
  role: string;
  testimonial: string;
  rating: number;
  profile_image_url: string | null;
}

export async function fetchPublicTestimonials(limit = 20): Promise<PublicTestimonial[]> {
  try {
    const res = await fetch(`${API_BASE}/public/testimonials?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface PublicServiceCard {
  id: string;
  title: string;
  body: string;
}

export async function fetchPublicServiceCards(limit = 50): Promise<PublicServiceCard[]> {
  try {
    const res = await fetch(`${API_BASE}/public/service-cards?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface PublicContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitPublicContact(payload: PublicContactPayload): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
