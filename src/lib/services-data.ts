import type { LucideIcon } from "lucide-react";
import { Car, UserCheck, Plane, Building2, Camera, CalendarDays } from "lucide-react";

export type ServiceIconKey = "car" | "user-check" | "plane" | "building" | "camera" | "calendar";

export interface ServiceItem {
  icon: ServiceIconKey;
  title: string;
  tagline: string;
  description: string;
  perks: string[];
  ctaText: string;
  displayOrder?: number;
}

export const SERVICE_ICONS: Record<ServiceIconKey, LucideIcon> = {
  car: Car,
  "user-check": UserCheck,
  plane: Plane,
  building: Building2,
  camera: Camera,
  calendar: CalendarDays,
};

export const defaultServicesHero = {
  eyebrow: "Our Services",
  title: "Every Journey,\nFully Covered.",
  intro:
    "Whether you need a quick city transfer, a weeklong safari expedition, or a long-term corporate fleet — we have a service tailored to your exact needs.",
};

export const defaultServiceItems: ServiceItem[] = [
  {
    icon: "car",
    title: "Self-Drive Car Rental",
    tagline: "Freedom to explore at your pace",
    description:
      "Take the wheel and discover East Africa on your own terms. Perfect for tourists, business professionals, NGOs, expatriates, and residents who prefer independence.",
    perks: [
      "Flexible pick-up and drop-off locations",
      "No minimum duration requirements",
      "Comprehensive insurance included",
      "GPS navigation available on request",
      "24/7 roadside emergency support",
      "Cross-border documentation handled",
    ],
    ctaText: "Book Self-Drive",
  },
  {
    icon: "user-check",
    title: "Chauffeur-Driven Car Hire",
    tagline: "Professional drivers, professional service",
    description:
      "Travel in complete comfort with experienced, professional drivers who know every road across Rwanda, Uganda, and Tanzania. Arrive relaxed, every time.",
    perks: [
      "Vetted, multilingual professional drivers",
      "Punctual and discreet service",
      "Airport meet-and-greet service",
      "Half-day and full-day hire options",
      "Ideal for executives and VIP guests",
      "Available for corporate events and conferences",
    ],
    ctaText: "Book Chauffeur",
  },
  {
    icon: "plane",
    title: "Airport Transfers",
    tagline: "Reliable, on time, every flight",
    description:
      "Stress-free arrivals and departures. We monitor your flight in real time and guarantee your driver will be waiting — whether you're arriving in Kigali, Entebbe, Dar es Salaam, or beyond.",
    perks: [
      "Real-time flight monitoring",
      "Meet & greet with name board",
      "Kigali, Entebbe, Dar es Salaam, Arusha, Zanzibar",
      "Fixed pricing — no surge fees",
      "Prompt, door-to-door service",
      "Available 24 hours a day",
    ],
    ctaText: "Book Airport Transfer",
  },
  {
    icon: "building",
    title: "Corporate Car Rental",
    tagline: "Fleet solutions for businesses and organizations",
    description:
      "Flexible transport for businesses, embassies, NGOs, government institutions, international organizations, and conference delegates. Invoiced accounts and fleet management available.",
    perks: [
      "Dedicated account management",
      "Monthly invoicing available",
      "Executive sedans, SUVs, and vans",
      "Conference and event transportation",
      "Embassy and diplomatic transport",
      "Scalable — 1 vehicle to full fleet",
    ],
    ctaText: "Request Corporate Quote",
  },
  {
    icon: "camera",
    title: "Safari Vehicle Rental",
    tagline: "Built for the wild",
    description:
      "Fully equipped 4x4 safari vehicles ideal for national park game drives, wildlife photography tours, camping trips, gorilla trekking, and adventure travel across East Africa's greatest parks.",
    perks: [
      "Pop-up roof for wildlife photography",
      "Extended fuel range for remote areas",
      "Refrigerator and camping equipment available",
      "Experienced safari driver-guides",
      "All major parks: Serengeti, Bwindi, Akagera",
      "Park permits and logistics assistance",
    ],
    ctaText: "Book Safari Vehicle",
  },
  {
    icon: "calendar",
    title: "Long-Term Car Leasing",
    tagline: "Cost-effective for extended stays",
    description:
      "Cost-effective vehicle leasing for businesses, development projects, consultants, and long-stay visitors. Monthly rates with flexible terms and full maintenance coverage included.",
    perks: [
      "Weekly and monthly pricing tiers",
      "Full maintenance and servicing included",
      "Swap vehicle if needed during lease",
      "Insurance and roadside assist included",
      "Perfect for expats and project staff",
      "Dedicated fleet manager assigned",
    ],
    ctaText: "Get Leasing Quote",
  },
];

export const defaultPerfectFor = {
  eyebrow: "Perfect For",
  title: "Who We Serve",
  items: [
    "Business Travel",
    "Family Vacations",
    "Safari Tours",
    "Gorilla Trekking",
    "Wedding Transportation",
    "Conference Transportation",
    "NGO Fleet Hire",
    "Diplomatic Missions",
    "Student Transport",
    "Airport Transfers",
    "Cross-Border Road Trips",
    "Tourism and Adventure",
  ],
};

export const defaultServicesCta = {
  title: "Not Sure Which Service You Need?",
  description:
    "Our team will help you find the right vehicle and service for your journey. No obligation — just expert advice.",
  button: "Talk to Our Team",
};
