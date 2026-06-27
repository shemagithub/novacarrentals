import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/contexts/LanguageContext";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t } = useLang();

  const links = [
    { href: "/", label: t("nav_home") },
    { href: "/fleet", label: t("nav_fleet") },
    { href: "/services", label: t("nav_services") },
    { href: "/destinations", label: t("nav_destinations") },
    { href: "/about", label: t("nav_about") },
    { href: "/contact", label: t("nav_contact") },
  ];

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Compass className="w-8 h-8 text-primary group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-display font-bold text-xl tracking-wider text-foreground">NOVACAR<span className="text-primary">.</span></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-5">
            <div className="flex space-x-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <LanguageSwitcher />
            <Link href="/contact">
              <Button className="font-display font-semibold uppercase tracking-wider text-xs">
                {t("nav_book")}
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary transition-colors p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-4 text-base font-medium border-b border-border/50 last:border-0 ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 px-3">
              <Link href="/contact" className="w-full">
                <Button className="w-full font-display font-semibold uppercase tracking-wider text-sm h-12">
                  {t("nav_book")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
