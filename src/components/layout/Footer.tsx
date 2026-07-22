import { Link } from "wouter";
import { Compass, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  brandingEmail,
  brandingFooterTagline,
  brandingPhone,
  formatBrandingAddress,
  getSocialLinks,
} from "@/lib/branding-helpers";

export function Footer() {
  const { t } = useLang();
  const { branding, siteName, logoSrc, loading } = useSiteSettings();
  const company = branding?.company;
  const displayName = branding?.company_name?.trim() || siteName;
  const social = getSocialLinks(branding);
  const address = formatBrandingAddress(company);
  const phone = brandingPhone(company);
  const email = brandingEmail(company);
  const tagline = brandingFooterTagline(branding, t("footer_tagline"));
  const credit =
    branding?.footer_credit_line?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. ${t("footer_rights")}`;

  const quickLinks = [
    { label: t("nav_home"), href: "/" },
    { label: t("nav_fleet"), href: "/fleet" },
    { label: t("nav_services"), href: "/services" },
    { label: t("nav_destinations"), href: "/destinations" },
    { label: t("nav_blogs"), href: "/blogs" },
    { label: t("nav_about"), href: "/about" },
    { label: t("nav_contact"), href: "/contact" },
  ];

  const serviceLinks = [
    "Self-Drive Rental",
    "Chauffeur-Driven",
    "Airport Transfers",
    "Safari Vehicles",
    "Corporate Fleet",
    "Long-Term Leasing",
  ];

  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              {loading && !logoSrc ? (
                <div className="h-10 w-10 rounded-sm bg-muted animate-pulse shrink-0" aria-hidden />
              ) : logoSrc ? (
                <img
                  src={logoSrc}
                  alt={displayName}
                  className="h-10 w-auto max-w-[160px] object-contain shrink-0"
                />
              ) : (
                <Compass className="w-8 h-8 text-primary shrink-0 group-hover:rotate-45 transition-transform duration-500" />
              )}
              <span className="font-display font-bold text-xl tracking-tight text-foreground leading-tight">
                {loading && !displayName ? (
                  <span className="inline-block h-6 w-36 bg-muted animate-pulse rounded-sm" aria-hidden />
                ) : (
                  displayName
                )}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm whitespace-pre-line">
              {tagline}
            </p>
            <div className="flex gap-4">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_links")}</h4>
            <ul className="space-y-4">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-primary/50 rounded-full" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_services")}</h4>
            <ul className="space-y-4">
              {serviceLinks.map((item) => (
                <li key={item}>
                  <Link
                    href="/services"
                    className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-primary/50 rounded-full" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-primary transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                  {email}
                </a>
              </li>
              {branding?.business_hours_text && (
                <li className="text-sm text-muted-foreground whitespace-pre-line pl-8">
                  {branding.business_hours_text}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">{credit}</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">
              {t("footer_privacy")}
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t("footer_terms")}
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              {t("footer_rental")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
