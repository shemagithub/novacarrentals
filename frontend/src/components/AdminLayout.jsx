import { Suspense, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import HeaderSocialLinks from "./HeaderSocialLinks";
import { Bell, List, MagnifyingGlass } from "@phosphor-icons/react";
import { Outlet, useLocation } from "react-router-dom";
import { useBranding } from "@/contexts/BrandingContext";

const TITLES = {
  "/": "Dashboard",
  "/vehicles": "Vehicle Management",
  "/vehicle-categories": "Vehicle Categories",
  "/bookings": "Booking Management",
  "/customers": "Customer Management",
  "/drivers": "Driver Management",
  "/payments": "Payments & Finance",
  "/maintenance": "Fleet Maintenance",
  "/blogs": "Blog Posts",
  "/travel-guides": "Travel Guides",
  "/destinations": "Destinations Page",
  "/team": "Team Members",
  "/company": "Company Profile",
  "/contacts": "Contact Form Messages",
  "/home": "Home Page (CMS)",
  "/about": "About Page (CMS)",
  "/service": "Services Page (CMS)",
  "/page-seo": "Page SEO",
  "/branches": "Locations & Branches",
  "/promotions": "Promotions & Marketing",
  "/reports": "Reports & Analytics",
  "/users": "Users & Roles",
  "/notifications": "Notifications",
  "/support": "Support & Helpdesk",
  "/ai": "AI Smart Features",
  "/settings": "Settings",
};

export default function AdminLayout() {
  const { company_name, social_links } = useBranding();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  let title = TITLES[location.pathname] || "Admin";
  if (location.pathname.startsWith("/vehicles/") && location.pathname !== "/vehicles") {
    title = "Vehicle Detail";
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA]" data-testid="admin-layout">
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden ${mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden
        onClick={() => setMobileNavOpen(false)}
      />
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="min-w-0 lg:ml-64">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20 flex h-16 min-h-16 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 lg:px-8" data-testid="admin-header">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="lg:hidden flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-sm text-neutral-800 hover:bg-neutral-100"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
              data-testid="header-menu-button"
            >
              <List size={22} weight="bold" />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 truncate sm:max-w-none" data-testid="header-company-name">{company_name}</div>
              <h1 className="font-display text-base font-semibold leading-tight text-neutral-900 sm:text-lg truncate" data-testid="page-title">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <HeaderSocialLinks social={social_links} />
            <div className="relative hidden md:block">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-52 rounded-sm border border-neutral-200 bg-neutral-100 py-2 pl-9 pr-4 text-xs focus:border-[#E60000] focus:outline-none lg:w-64"
                data-testid="header-search"
              />
            </div>
            <button type="button" className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-2 hover:bg-neutral-100" data-testid="header-notifications">
              <Bell size={18} className="text-neutral-700" />
              <span className="absolute right-2 top-2 h-2 w-2 bg-[#E60000]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="fade-up min-w-0 p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={
              <div
                className="flex min-h-[30vh] items-center justify-center text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500"
                data-testid="route-suspense-fallback"
              >
                Loading…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
