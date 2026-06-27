export interface Vehicle {
  id: string;
  name: string;
  category: string;
  type: string;
  pricePerDay: number;
  seats: number;
  fuel: string;
  tags: string[];
}

export interface Booking {
  vehicleId: string;
  from: Date;
  to: Date;
  label: string; // e.g. "Kigali → Musanze"
}

export const vehicles: Vehicle[] = [
  { id: "lc200", name: "Toyota Land Cruiser V8", category: "Safari & 4x4", type: "4x4 Safari", pricePerDay: 120, seats: 7, fuel: "Diesel", tags: ["Safari Ready", "Most Popular"] },
  { id: "prado", name: "Toyota Prado", category: "Safari & 4x4", type: "4x4 SUV", pricePerDay: 110, seats: 7, fuel: "Diesel", tags: ["Off-Road"] },
  { id: "fortuner", name: "Toyota Fortuner", category: "Safari & 4x4", type: "4x4 SUV", pricePerDay: 95, seats: 7, fuel: "Diesel", tags: [] },
  { id: "hilux", name: "Toyota Hilux Double Cab", category: "Safari & 4x4", type: "4x4 Pickup", pricePerDay: 85, seats: 5, fuel: "Diesel", tags: ["Work Ready"] },
  { id: "safari-van", name: "Safari Van (Popup Roof)", category: "Safari & 4x4", type: "Safari Vehicle", pricePerDay: 130, seats: 7, fuel: "Diesel", tags: ["Safari Ready", "Photography"] },
  { id: "camry", name: "Toyota Camry", category: "Executive & Luxury", type: "Executive Sedan", pricePerDay: 70, seats: 5, fuel: "Petrol", tags: ["Business"] },
  { id: "mercedes", name: "Mercedes E-Class", category: "Executive & Luxury", type: "Luxury Sedan", pricePerDay: 150, seats: 4, fuel: "Petrol", tags: ["Premium", "VIP"] },
  { id: "bmw5", name: "BMW 5 Series", category: "Executive & Luxury", type: "Luxury Sedan", pricePerDay: 140, seats: 4, fuel: "Petrol", tags: ["Premium"] },
  { id: "rr-sport", name: "Range Rover Sport", category: "Executive & Luxury", type: "Luxury SUV", pricePerDay: 200, seats: 5, fuel: "Diesel", tags: ["Luxury", "VIP"] },
  { id: "rav4", name: "Toyota RAV4", category: "Economy & Compact", type: "Compact SUV", pricePerDay: 75, seats: 5, fuel: "Petrol", tags: ["Bestseller"] },
  { id: "corolla", name: "Toyota Corolla", category: "Economy & Compact", type: "Compact Car", pricePerDay: 45, seats: 5, fuel: "Petrol", tags: ["Affordable"] },
  { id: "note", name: "Nissan Note", category: "Economy & Compact", type: "Economy Car", pricePerDay: 35, seats: 5, fuel: "Petrol", tags: ["Budget Friendly"] },
  { id: "vitz", name: "Toyota Vitz", category: "Economy & Compact", type: "Economy Car", pricePerDay: 30, seats: 4, fuel: "Petrol", tags: [] },
  { id: "hiace", name: "Toyota Hiace Van", category: "Vans & Groups", type: "Passenger Van", pricePerDay: 90, seats: 14, fuel: "Diesel", tags: ["Group Travel"] },
  { id: "coaster", name: "Rosa Coaster Bus", category: "Vans & Groups", type: "Minibus", pricePerDay: 130, seats: 30, fuel: "Diesel", tags: ["Groups", "Events"] },
  { id: "wedding", name: "Wedding / VIP Car", category: "Vans & Groups", type: "VIP Vehicle", pricePerDay: 180, seats: 4, fuel: "Petrol", tags: ["Wedding", "Special"] },
];

// Generate realistic mock bookings offset from today
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const routes = [
  "Kigali → Musanze", "Kigali → Akagera NP", "Kigali → Kampala",
  "Entebbe → Bwindi", "Kampala → Murchison Falls", "Dar es Salaam → Arusha",
  "Arusha → Serengeti", "Kigali → Rubavu", "Kigali Airport Transfer",
  "Kampala → Kabale", "Arusha → Ngorongoro", "Kigali → Nyungwe NP",
];

// Pre-seeded bookings: {vehicleId, fromOffset, toOffset, routeIdx}
const seeds: Array<{ vehicleId: string; from: number; to: number; route: number }> = [
  { vehicleId: "lc200", from: 0, to: 3, route: 0 },
  { vehicleId: "lc200", from: 8, to: 14, route: 4 },
  { vehicleId: "lc200", from: 22, to: 28, route: 5 },
  { vehicleId: "lc200", from: 35, to: 42, route: 11 },

  { vehicleId: "prado", from: 2, to: 5, route: 1 },
  { vehicleId: "prado", from: 12, to: 19, route: 6 },
  { vehicleId: "prado", from: 30, to: 34, route: 3 },

  { vehicleId: "fortuner", from: 1, to: 4, route: 7 },
  { vehicleId: "fortuner", from: 15, to: 20, route: 9 },
  { vehicleId: "fortuner", from: 38, to: 45, route: 2 },

  { vehicleId: "hilux", from: 5, to: 8, route: 2 },
  { vehicleId: "hilux", from: 20, to: 25, route: 0 },

  { vehicleId: "safari-van", from: 3, to: 9, route: 6 },
  { vehicleId: "safari-van", from: 18, to: 24, route: 10 },
  { vehicleId: "safari-van", from: 32, to: 37, route: 5 },

  { vehicleId: "camry", from: 0, to: 2, route: 8 },
  { vehicleId: "camry", from: 7, to: 10, route: 8 },
  { vehicleId: "camry", from: 25, to: 29, route: 7 },

  { vehicleId: "mercedes", from: 4, to: 6, route: 8 },
  { vehicleId: "mercedes", from: 16, to: 20, route: 1 },
  { vehicleId: "mercedes", from: 40, to: 44, route: 8 },

  { vehicleId: "bmw5", from: 3, to: 5, route: 8 },
  { vehicleId: "bmw5", from: 14, to: 18, route: 7 },

  { vehicleId: "rr-sport", from: 1, to: 4, route: 9 },
  { vehicleId: "rr-sport", from: 22, to: 30, route: 2 },

  { vehicleId: "rav4", from: 0, to: 3, route: 0 },
  { vehicleId: "rav4", from: 10, to: 13, route: 1 },
  { vehicleId: "rav4", from: 28, to: 35, route: 6 },

  { vehicleId: "corolla", from: 2, to: 4, route: 8 },
  { vehicleId: "corolla", from: 18, to: 21, route: 7 },

  { vehicleId: "note", from: 6, to: 9, route: 0 },
  { vehicleId: "note", from: 30, to: 33, route: 1 },

  { vehicleId: "hiace", from: 5, to: 12, route: 3 },
  { vehicleId: "hiace", from: 20, to: 26, route: 4 },
  { vehicleId: "hiace", from: 38, to: 44, route: 11 },

  { vehicleId: "coaster", from: 8, to: 10, route: 8 },
  { vehicleId: "coaster", from: 25, to: 28, route: 8 },

  { vehicleId: "wedding", from: 3, to: 3, route: 8 },
  { vehicleId: "wedding", from: 17, to: 17, route: 8 },
  { vehicleId: "wedding", from: 35, to: 35, route: 8 },
];

export const bookings: Booking[] = seeds.map((s) => ({
  vehicleId: s.vehicleId,
  from: addDays(today, s.from),
  to: addDays(today, s.to),
  label: routes[s.route],
}));

/** Returns true if the vehicle has any booking that overlaps [from, to] */
export function isVehicleBooked(vehicleId: string, from: Date, to: Date): boolean {
  return bookings.some((b) => {
    if (b.vehicleId !== vehicleId) return false;
    // Overlap: booking starts before selection ends AND booking ends after selection starts
    return b.from <= to && b.to >= from;
  });
}

/** Returns all bookings for a vehicle in the given range */
export function getVehicleBookings(vehicleId: string, from: Date, to: Date): Booking[] {
  return bookings.filter(
    (b) => b.vehicleId === vehicleId && b.from <= to && b.to >= from
  );
}

/** Get all dates that have at least one booking (for calendar dot highlights) */
export function getBookedDates(): Date[] {
  const dates: Date[] = [];
  bookings.forEach((b) => {
    const cur = new Date(b.from);
    while (cur <= b.to) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  });
  return dates;
}

export const categories = ["All", ...Array.from(new Set(vehicles.map((v) => v.category)))];
