import type { PublicBranding, PublicBrandingSeo } from "@/lib/api";
import { absoluteAssetUrl, absoluteMarketingUrl } from "@/lib/site-url";
import {
  breadcrumbJsonLd,
  mergeJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/json-ld";

export interface PageSeoInput {
  title: string;
  description: string;
  image?: string;
  /** Full canonical URL; defaults to origin + pathname. */
  canonical?: string;
  /** Override robots for this page only (e.g. noindex). */
  robots?: string;
  /** Extra JSON-LD objects merged with site-wide schemas. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export interface SeoApplyContext {
  global: PublicBrandingSeo;
  logoSrc: string | null;
  siteName: string;
  siteOrigin: string;
  pathname: string;
  branding?: PublicBranding | null;
}

export function setMetaTag(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function setLinkTag(rel: string, href: string, id?: string) {
  if (!href) return;
  const linkId = id || `seo-link-${rel}`;
  let el = document.head.querySelector<HTMLLinkElement>(`link#${linkId}`);
  if (!el) {
    el = document.createElement("link");
    el.id = linkId;
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function applyJsonLdScripts(blocks: Record<string, unknown>[]) {
  document.querySelectorAll('script[type="application/ld+json"][data-seo-jsonld]').forEach((n) => n.remove());
  blocks.forEach((block, index) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    script.id = `seo-jsonld-${index}`;
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  });
}

export function applyPageSeoToDocument(page: PageSeoInput, ctx: SeoApplyContext) {
  const { global, logoSrc, siteName, siteOrigin, pathname, branding } = ctx;
  const origin = siteOrigin;
  const canonical = page.canonical || (origin ? absoluteMarketingUrl(origin, pathname) : "");
  const imageRaw = page.image || global.og_image_url;
  const image = origin ? absoluteAssetUrl(origin, imageRaw) : imageRaw;
  const robots = page.robots || global.robots;

  document.documentElement.lang = global.language || "en";
  document.title = page.title;

  setMetaTag("description", page.description);
  setMetaTag("robots", robots);
  setMetaTag("og:title", page.title, "property");
  setMetaTag("og:description", page.description, "property");
  setMetaTag("og:type", global.og_type || "website", "property");
  setMetaTag("og:image", image, "property");
  setMetaTag("og:site_name", siteName, "property");
  if (canonical) {
    setMetaTag("og:url", canonical, "property");
    setLinkTag("canonical", canonical, "seo-canonical");
  }
  setMetaTag("twitter:card", global.twitter_card, "name");
  setMetaTag("twitter:title", page.title, "name");
  setMetaTag("twitter:description", page.description, "name");
  setMetaTag("twitter:image", image, "name");

  let favicon = document.querySelector<HTMLLinkElement>("link#site-favicon");
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.id = "site-favicon";
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  if (logoSrc) {
    favicon.href = logoSrc;
    if (/\.svg(\?|$)/i.test(logoSrc)) favicon.type = "image/svg+xml";
    else favicon.removeAttribute("type");
  } else {
    favicon.type = "image/svg+xml";
    favicon.href = "/favicon.svg";
  }

  const extra = Array.isArray(page.jsonLd) ? page.jsonLd : page.jsonLd ? [page.jsonLd] : [];
  const schemas = mergeJsonLd(
    organizationJsonLd(branding, origin),
    websiteJsonLd(siteName, origin),
    breadcrumbJsonLd(pathname, origin),
    ...extra,
  );
  applyJsonLdScripts(schemas);
}

export function truncateDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function formatPageTitle(pageTitle: string, siteName: string): string {
  const page = pageTitle.trim();
  const site = siteName.trim();
  if (!page) return site || "Nova Car Rentals";
  if (!site || page.toLowerCase() === site.toLowerCase()) return page;
  return `${page} | ${site}`;
}

/** @deprecated use applyPageSeoToDocument(page, ctx) */
export function applyPageSeoLegacy(
  page: PageSeoInput,
  global: PublicBrandingSeo,
  logoSrc: string | null,
) {
  applyPageSeoToDocument(page, {
    global,
    logoSrc,
    siteName: global.title,
    siteOrigin: "",
    pathname: typeof window !== "undefined" ? window.location.pathname : "/",
    branding: null,
  });
}
