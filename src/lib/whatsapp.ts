import type { PublicBranding } from "@/lib/api";
import { brandingPhone } from "@/lib/branding-helpers";

const FALLBACK_WA_DIGITS = "250788000000";

/** Strip to digits for wa.me phone segment. */
export function whatsAppDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normalize any admin phone / wa.me / api.whatsapp.com value to `https://wa.me/<digits>`.
 */
export function normalizeWhatsAppBaseUrl(
  raw: string | null | undefined,
  fallbackPhone?: string,
): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    const digits = whatsAppDigits(fallbackPhone || FALLBACK_WA_DIGITS);
    return `https://wa.me/${digits || FALLBACK_WA_DIGITS}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.hostname === "wa.me" || u.hostname.endsWith(".wa.me")) {
        const phone = u.pathname.replace(/^\//, "").split("/")[0];
        const digits = whatsAppDigits(phone);
        if (digits) return `https://wa.me/${digits}`;
      }
      if (u.hostname === "api.whatsapp.com") {
        const phone = u.searchParams.get("phone");
        const digits = whatsAppDigits(phone || "");
        if (digits) return `https://wa.me/${digits}`;
      }
    } catch {
      /* fall through */
    }
  }

  if (/^wa\.me\//i.test(trimmed)) {
    const phone = trimmed.replace(/^wa\.me\//i, "").split(/[?#]/)[0];
    const digits = whatsAppDigits(phone);
    if (digits) return `https://wa.me/${digits}`;
  }

  if (/^api\.whatsapp\.com\//i.test(trimmed)) {
    try {
      const u = new URL(`https://${trimmed}`);
      const phone = u.searchParams.get("phone");
      const digits = whatsAppDigits(phone || "");
      if (digits) return `https://wa.me/${digits}`;
    } catch {
      /* fall through */
    }
  }

  const digits = whatsAppDigits(trimmed);
  if (digits) return `https://wa.me/${digits}`;

  const fallback = whatsAppDigits(fallbackPhone || FALLBACK_WA_DIGITS);
  return `https://wa.me/${fallback || FALLBACK_WA_DIGITS}`;
}

export function getWhatsAppBaseUrl(branding: PublicBranding | null): string {
  const configured = branding?.social_links?.whatsapp?.trim();
  const fallbackPhone = brandingPhone(branding?.company);
  return normalizeWhatsAppBaseUrl(configured, fallbackPhone);
}

/** Build a wa.me link with optional pre-filled message. */
export function buildWhatsAppChatUrl(baseUrl: string, message?: string): string {
  const base = normalizeWhatsAppBaseUrl(baseUrl);
  const text = (message || "").trim();
  if (!text) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}text=${encodeURIComponent(text)}`;
}

export function getWhatsAppChatUrl(branding: PublicBranding | null, message?: string): string {
  return buildWhatsAppChatUrl(getWhatsAppBaseUrl(branding), message);
}

/** Open WhatsApp in a new tab / native app (must run inside a user click handler). */
export function openWhatsAppChat(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatBookingWhatsAppMessage(
  vehicleName: string,
  fromDisplay: string,
  toDisplay: string,
  companyName = "NOVACAR",
): string {
  return (
    `Hello ${companyName}! I'd like to book a *${vehicleName}* ` +
    `from *${fromDisplay}* to *${toDisplay}*. Please confirm availability and send me a quote.`
  );
}

export function formatVehicleEnquiryMessage(
  vehicleName: string,
  vehicleType: string,
  companyName = "NOVACAR",
): string {
  return (
    `Hello ${companyName}! I'm interested in booking the *${vehicleName}* (${vehicleType}). ` +
    `Could you please confirm availability and pricing?`
  );
}
