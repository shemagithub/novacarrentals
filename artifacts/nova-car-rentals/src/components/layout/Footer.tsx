import { Link } from "wouter";
import { Compass, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLang();

  const quickLinks = [
    { label: t("nav_home"), href: "/" },
    { label: t("nav_fleet"), href: "/fleet" },
    { label: t("nav_services"), href: "/services" },
    { label: t("nav_destinations"), href: "/destinations" },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Compass className="w-8 h-8 text-primary group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-display font-bold text-xl tracking-wider text-foreground">NOVACAR<span className="text-primary">.</span></span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t("footer_tagline")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_links")}</h4>
            <ul className="space-y-4">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary/50 rounded-full" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_services")}</h4>
            <ul className="space-y-4">
              {serviceLinks.map((item) => (
                <li key={item}>
                  <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary/50 rounded-full" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 text-foreground">{t("footer_contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Kigali International Airport Road<br/>Kigali, Rwanda</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+250 788 000 000</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>reservations@novacar.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Novacar Rentals. {t("footer_rights")}
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">{t("footer_privacy")}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{t("footer_terms")}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{t("footer_rental")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
