import { NavLink } from "react-router-dom";
import {
  Gauge, Car, Calendar, Users, IdentificationCard, CreditCard, Wrench, Tag,
  Article, UsersThree, ShootingStar, Buildings, Envelope, BookOpen, Briefcase,   MapPin, Megaphone, ChartBar, ShieldCheck, Bell,
  Headset, Gear, Sparkle, SignOut, X, MapTrifold, House
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useNavigate } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: Gauge, end: true },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/vehicle-categories", label: "Vehicle categories", icon: Tag },
  { to: "/bookings", label: "Bookings", icon: Calendar },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/drivers", label: "Drivers", icon: IdentificationCard },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/home", label: "Home page", icon: House },
  { to: "/blogs", label: "Blogs", icon: Article },
  { to: "/travel-guides", label: "Travel guides", icon: MapTrifold },
  { to: "/destinations", label: "Destinations page", icon: MapPin },
  { to: "/team", label: "Team", icon: UsersThree },
  { to: "/testimonials", label: "Testimonials", icon: ShootingStar },
  { to: "/company", label: "Company profile", icon: Buildings },
  { to: "/contacts", label: "Contacts", icon: Envelope },
  { to: "/about", label: "About page", icon: BookOpen },
  { to: "/service", label: "Services page", icon: Briefcase },
  { to: "/page-seo", label: "Page SEO", icon: Article },
  { to: "/branches", label: "Branches", icon: MapPin },
  { to: "/promotions", label: "Promotions", icon: Megaphone },
  { to: "/reports", label: "Reports", icon: ChartBar },
  { to: "/users", label: "Users & Roles", icon: ShieldCheck },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/support", label: "Support", icon: Headset },
  { to: "/ai", label: "AI Smart", icon: Sparkle },
  { to: "/settings", label: "Settings", icon: Gear },
];

export default function Sidebar({ mobileOpen = false, onNavigate }) {
  const { user, logout } = useAuth();
  const { company_name, logoSrc } = useBranding();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const afterNav = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={[
        "fixed top-0 left-0 h-screen w-64 max-w-[85vw] bg-white border-r border-neutral-200 flex flex-col z-40",
        "shadow-xl lg:shadow-none transform transition-transform duration-200 ease-out will-change-transform",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
      data-testid="admin-sidebar"
    >
      {/* Brand */}
      <div className="relative px-6 py-5 border-b border-neutral-200 pr-14 lg:pr-6">
        <button
          type="button"
          onClick={afterNav}
          className="lg:hidden absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-neutral-600 hover:bg-neutral-100"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
        <div className="flex items-center gap-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="w-8 h-8 object-contain border border-neutral-200 bg-white rounded-sm"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-[#E60000] flex items-center justify-center shrink-0">
              <Car size={18} weight="fill" className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-display font-bold text-base tracking-tight leading-none truncate" data-testid="sidebar-company-name">{company_name}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-1">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3" data-testid="sidebar-nav">
        <div className="px-4 mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
          Operations
        </div>
        {NAV.slice(0, 8).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={afterNav}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <item.icon size={16} weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="px-4 mt-4 mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
          Marketing
        </div>
        {NAV.slice(8, 20).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={afterNav}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <item.icon size={16} weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="px-4 mt-4 mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
          System
        </div>
        {NAV.slice(20).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={afterNav}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <item.icon size={16} weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" data-testid="sidebar-user-name">{user?.name || "Admin"}</div>
            <div className="text-[10px] text-neutral-500 truncate font-mono">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="min-h-[44px] min-w-[44px] flex shrink-0 items-center justify-center p-2 hover:bg-neutral-100 transition-colors"
            data-testid="logout-button"
            title="Logout"
          >
            <SignOut size={16} className="text-neutral-700" />
          </button>
        </div>
      </div>
    </aside>
  );
}
