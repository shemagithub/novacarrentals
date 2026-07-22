import type { PublicBranding, PublicCompanyInfo } from "@/lib/api";
import { getWhatsAppBaseUrl } from "@/lib/whatsapp";

const FALLBACK_PHONE = "+250 788 000 000";
const FALLBACK_EMAIL = "reservations@novacar.com";
const FALLBACK_ADDRESS = "Kigali International Airport Road, Kigali, Rwanda";

export function formatBrandingAddress(company?: PublicCompanyInfo | null): string {
  if (!company) return FALLBACK_ADDRESS;
  const parts = [
    company.address_line1,
    company.address_line2,
    [company.city, company.state_region].filter(Boolean).join(", "),
    company.postal_code,
    company.country,
  ].filter((p) => p && String(p).trim());
  return parts.length ? parts.join("\n") : FALLBACK_ADDRESS;
}

export function brandingPhone(company?: PublicCompanyInfo | null): string {
  return (company?.phone || "").trim() || FALLBACK_PHONE;
}

export function brandingEmail(company?: PublicCompanyInfo | null): string {
  return (company?.email || "").trim() || FALLBACK_EMAIL;
}

export function brandingFooterTagline(branding: PublicBranding | null, fallback: string): string {
  return (
    branding?.footer_description?.trim() ||
    branding?.company?.description?.trim() ||
    branding?.footer_tagline?.trim() ||
    fallback
  );
}

export function getWhatsAppUrl(branding: PublicBranding | null): string {
  return getWhatsAppBaseUrl(branding);
}

export function getSocialLinks(branding: PublicBranding | null) {
  const s = branding?.social_links ?? {};
  return {
    facebook: s.facebook || null,
    instagram: s.instagram || null,
    twitter: s.twitter || s.x || null,
    linkedin: s.linkedin || null,
    youtube: s.youtube || null,
    tiktok: s.tiktok || null,
    whatsapp: getWhatsAppUrl(branding),
  };
}
