import { API_BASE } from "@/lib/api";
import { cleanDisplayText } from "@/lib/display-text";
import { formatMoney, formatRatePerDay, type Currency } from "@/lib/formatMoney";

export interface PublicVehicleSummary {
  id: string;
  name: string;
  brand: string;
  model_name: string;
  description?: string | null;
  category: string;
  year?: number;
  fuel_type: string;
  transmission: string;
  seats: number;
  daily_rate: number;
  status: string;
  condition?: string;
  features: string[];
  image_url: string | null;
  gallery_images: string[];
  branch_display?: string | null;
}

export interface PublicVehicleDetail extends PublicVehicleSummary {
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  hourly_rate?: number | null;
  doors?: number | null;
  luggage_capacity?: string | null;
  deposit_amount?: number | null;
  insurance_cost?: number | null;
  driver_fee?: number | null;
  late_return_fee?: number | null;
  airport_pickup_fee?: number | null;
  fuel_policy?: string | null;
  cancellation_policy?: string | null;
  smoking_policy?: string | null;
  pets_policy?: string | null;
  cross_border_policy?: string | null;
  min_driver_age?: number | null;
  license_requirements?: string | null;
  id_requirements?: string | null;
  international_license_policy?: string | null;
  engine_size?: string | null;
  horsepower?: number | null;
  fuel_consumption?: string | null;
  mileage?: number | null;
  mileage_limit_per_day?: number | null;
  comfort_features: string[];
  safety_features: string[];
  air_conditioning?: boolean;
  gps_enabled?: boolean;
  image_slots?: { label: string; url: string }[];
}

/** Normalized vehicle for marketing UI (list + detail). */
export interface VehicleDisplay {
  id: string;
  name: string;
  category: string;
  type: string;
  pricePerDay: number;
  priceWeekly?: number;
  priceMonthly?: number;
  seats: number;
  bags: number;
  fuel: string;
  transmission: string;
  ac: boolean;
  tags: string[];
  badge?: string;
  status: string;
  imageUrl: string | null;
  galleryImages: string[];
  imagePlaceholder: string;
  description: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  idealFor: string[];
  specs: { label: string; value: string }[];
  branchDisplay?: string | null;
  driverFee?: number;
}

export interface PublicBranch {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  is_pickup?: boolean;
}

export async function fetchPublicVehicles(limit = 100): Promise<PublicVehicleSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/public/vehicles?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchPublicBranches(limit = 100): Promise<PublicBranch[]> {
  try {
    const res = await fetch(`${API_BASE}/public/branches?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchPublicVehicleById(id: string): Promise<PublicVehicleDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/public/vehicles/${encodeURIComponent(id)}`, {
      credentials: "omit",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicVehicleDetail;
  } catch {
    return null;
  }
}

function parseBags(raw: string | null | undefined, seats: number): number {
  if (!raw) return Math.max(1, Math.ceil(seats / 2));
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : Math.max(1, Math.ceil(seats / 2));
}

function statusBadge(status: string): string | undefined {
  const s = status.toLowerCase();
  if (s === "available") return "Available";
  if (s === "reserved") return "Reserved";
  if (s === "rented") return "On Hire";
  return undefined;
}

function idealForFromCategory(category: string): string[] {
  const c = category.toLowerCase();
  if (c.includes("safari") || c.includes("4x4")) {
    return ["Safari expeditions", "National parks", "Cross border travel", "Off road routes"];
  }
  if (c.includes("luxury") || c.includes("executive")) {
    return ["Business travel", "Airport transfers", "VIP events", "City driving"];
  }
  if (c.includes("van") || c.includes("bus") || c.includes("group")) {
    return ["Group travel", "Conferences", "Team transport", "Airport shuttles"];
  }
  if (c.includes("economy") || c.includes("compact")) {
    return ["City driving", "Budget travel", "Daily commutes", "Short trips"];
  }
  return ["Road trips", "City & highway driving", "Business & leisure"];
}

export function mapVehicleToDisplay(
  v: PublicVehicleSummary | PublicVehicleDetail,
  currency: Currency = "USD",
): VehicleDisplay {
  const detail = v as PublicVehicleDetail;
  const name = cleanDisplayText(v.name);
  const category = cleanDisplayText(v.category) || "General";
  const type = cleanDisplayText([v.brand, v.model_name].filter(Boolean).join(" ").trim() || v.category);
  const features = Array.isArray(v.features) ? v.features.filter(Boolean) : [];
  const comfort = Array.isArray(detail.comfort_features) ? detail.comfort_features.filter(Boolean) : [];
  const safety = Array.isArray(detail.safety_features) ? detail.safety_features.filter(Boolean) : [];
  const highlights = [...features, ...comfort, ...safety].slice(0, 6);
  const badge = statusBadge(v.status) ?? features[0];

  const adminDescription = String(detail.description ?? (v as PublicVehicleSummary).description ?? "").trim();
  const autoDescription = cleanDisplayText(
    [
      `${name} is a ${type} in our ${category} fleet.`,
      v.condition ? `Current condition: ${cleanDisplayText(v.condition)}.` : "",
      features.length ? `Highlights include ${features.slice(0, 3).map(cleanDisplayText).join(", ")}.` : "",
      v.branch_display ? `Based at ${cleanDisplayText(v.branch_display)}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  const description = adminDescription || autoDescription;

  const included = [
    "Comprehensive rental insurance",
    "24/7 roadside assistance",
    detail.gps_enabled ? "GPS tracking" : null,
    detail.air_conditioning !== false ? "Air conditioning" : null,
    detail.fuel_policy ? `Fuel policy: ${detail.fuel_policy}` : null,
    detail.cancellation_policy ? `Cancellation: ${detail.cancellation_policy}` : null,
  ].filter(Boolean) as string[];

  const notIncluded = [
    detail.fuel_policy?.toLowerCase().includes("full") ? null : "Fuel",
    detail.driver_fee
      ? `Professional driver (optional +${formatRatePerDay(detail.driver_fee, currency)})`
      : "Driver (optional add on)",
    "Border crossing fees (where applicable)",
    detail.pets_policy ? `Pets: ${detail.pets_policy}` : null,
  ].filter(Boolean) as string[];

  const specs: { label: string; value: string }[] = [
    { label: "Brand", value: cleanDisplayText(v.brand) },
    { label: "Model", value: cleanDisplayText(v.model_name) },
    { label: "Year", value: v.year ? String(v.year) : "" },
    { label: "Category", value: cleanDisplayText(v.category) },
    { label: "Transmission", value: cleanDisplayText(v.transmission) },
    { label: "Fuel", value: cleanDisplayText(v.fuel_type) },
    { label: "Seats", value: v.seats ? String(v.seats) : "" },
    { label: "Luggage", value: cleanDisplayText(detail.luggage_capacity) || `${parseBags(null, v.seats)} bags` },
    { label: "Doors", value: detail.doors ? String(detail.doors) : "" },
    { label: "Engine", value: cleanDisplayText(detail.engine_size) },
    { label: "Condition", value: cleanDisplayText(v.condition) },
    { label: "Status", value: cleanDisplayText(v.status) },
  ].filter((s) => s.value);

  return {
    id: String(v.id),
    name,
    category,
    type,
    pricePerDay: Number(v.daily_rate) || 0,
    priceWeekly: detail.weekly_rate ? Number(detail.weekly_rate) : undefined,
    priceMonthly: detail.monthly_rate ? Number(detail.monthly_rate) : undefined,
    seats: Number(v.seats) || 5,
    bags: parseBags(detail.luggage_capacity, Number(v.seats) || 5),
    fuel: cleanDisplayText(v.fuel_type),
    transmission: cleanDisplayText(v.transmission) || "Automatic",
    ac: detail.air_conditioning !== false,
    tags: features.slice(0, 3).map(cleanDisplayText).filter(Boolean),
    badge: badge ? cleanDisplayText(badge) : undefined,
    status: v.status || "available",
    imageUrl: v.image_url,
    galleryImages: v.gallery_images?.length ? v.gallery_images : v.image_url ? [v.image_url] : [],
    imagePlaceholder: (v.name?.charAt(0) || "🚗").toUpperCase(),
    description,
    highlights: highlights.length ? highlights.map(cleanDisplayText).filter(Boolean) : ["Professionally maintained fleet vehicle", "Fully insured for East Africa travel"],
    included: included.length ? included.map(cleanDisplayText).filter(Boolean) : ["Comprehensive insurance", "24/7 roadside assistance"],
    notIncluded: notIncluded.length ? notIncluded.map(cleanDisplayText).filter(Boolean) : ["Fuel", "Optional driver"],
    idealFor: idealForFromCategory(v.category),
    specs,
    branchDisplay: cleanDisplayText(v.branch_display) || null,
    driverFee: detail.driver_fee ? Number(detail.driver_fee) : undefined,
  };
}

export function groupVehiclesByCategory(vehicles: VehicleDisplay[]): { category: string; items: VehicleDisplay[] }[] {
  const map = new Map<string, VehicleDisplay[]>();
  for (const v of vehicles) {
    const cat = v.category || "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(v);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      items: sortFleetVehicles(items, "name-asc"),
    }));
}

export type FleetSortKey =
  | "category"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "seats-desc";

export const FLEET_SORT_OPTIONS: { value: FleetSortKey; label: string }[] = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "category", label: "Category: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "seats-desc", label: "Most seats" },
];

export function sortFleetVehicles(vehicles: VehicleDisplay[], sort: FleetSortKey): VehicleDisplay[] {
  const copy = [...vehicles];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.pricePerDay - b.pricePerDay || a.name.localeCompare(b.name));
    case "price-desc":
      return copy.sort((a, b) => b.pricePerDay - a.pricePerDay || a.name.localeCompare(b.name));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "seats-desc":
      return copy.sort((a, b) => b.seats - a.seats || a.name.localeCompare(b.name));
    case "category":
      return copy.sort(
        (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      );
    case "name-asc":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export interface PublicVehicleCategory {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
}

export async function fetchPublicVehicleCategories(limit = 100): Promise<PublicVehicleCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/public/vehicle-categories?limit=${limit}`, { credentials: "omit" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const VEHICLE_CATEGORIES_QUERY_KEY = ["public-vehicle-categories"] as const;

export const FLEET_QUERY_KEY = ["public-vehicles"] as const;

export function fleetVehicleQueryKey(id: string) {
  return ["public-vehicle", id] as const;
}
