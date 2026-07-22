import type { PublicBranding } from "@/lib/api";
import { absoluteAssetUrl, absoluteMarketingUrl, getMarketingSiteOrigin } from "@/lib/site-url";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/fleet": "Fleet",
  "/services": "Services",
  "/destinations": "Destinations",
  "/about": "About",
  "/contact": "Contact",
  "/guides": "Travel Guides",
  "/blogs": "Blog",
};

export function organizationJsonLd(branding: PublicBranding | null | undefined, origin: string) {
  const company = branding?.company;
  const name = branding?.company_name?.trim() || "Nova Car Rentals";
  const url = origin || getMarketingSiteOrigin(branding);

  const logoRaw = branding?.logo_url?.trim();

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name,
    url: url || undefined,
    description:
      branding?.seo?.description ||
      company?.description ||
      branding?.footer_description ||
      "Premium car rentals across Rwanda, Uganda, and Tanzania.",
    logo: logoRaw && url ? absoluteAssetUrl(url, logoRaw) : undefined,
    email: company?.email || undefined,
    telephone: company?.phone || undefined,
    areaServed: ["Rwanda", "Uganda", "Tanzania"],
    priceRange: "$$",
  };

  if (company?.address_line1 || company?.city) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: company.address_line1 || undefined,
      addressLocality: company.city || undefined,
      addressRegion: company.state_region || undefined,
      postalCode: company.postal_code || undefined,
      addressCountry: company.country || undefined,
    };
  }

  const sameAs = Object.values(branding?.social_links || {}).filter(Boolean);
  if (sameAs.length) schema.sameAs = sameAs;

  return schema;
}

export function websiteJsonLd(siteName: string, origin: string) {
  if (!origin) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/fleet?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(pathname: string, origin: string) {
  if (!origin) return null;
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  const items: { name: string; item: string }[] = [
    { name: "Home", item: absoluteMarketingUrl(origin, "/") },
  ];

  if (path === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin }],
    };
  }

  let built = "";
  segments.forEach((seg, idx) => {
    built += `/${seg}`;
    const isLast = idx === segments.length - 1;
    let name = ROUTE_LABELS[built];
    if (!name) {
      if (built.startsWith("/fleet/")) name = "Vehicle";
      else if (built.startsWith("/guides/")) name = "Guide";
      else if (built.startsWith("/blogs/")) name = "Article";
      else name = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (isLast && name === "Vehicle") name = "Vehicle details";
    items.push({ name, item: absoluteMarketingUrl(origin, built) });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function vehicleProductJsonLd(input: {
  name: string;
  description: string;
  image?: string | null;
  pricePerDay: number;
  category?: string;
  origin: string;
  path: string;
  brand?: string;
  priceCurrency?: string;
}) {
  const url = absoluteMarketingUrl(input.origin, input.path);
  const priceCurrency = "USD";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image || undefined,
    category: input.category || "Car rental",
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency,
      price: input.pricePerDay,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
    },
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  image?: string | null;
  origin: string;
  path: string;
  datePublished?: string | null;
  author?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image || undefined,
    datePublished: input.datePublished || undefined,
    author: input.author ? { "@type": "Person", name: input.author } : undefined,
    mainEntityOfPage: absoluteMarketingUrl(input.origin, input.path),
  };
}

export function mergeJsonLd(
  ...blocks: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown>[] {
  return blocks.filter(Boolean) as Record<string, unknown>[];
}
