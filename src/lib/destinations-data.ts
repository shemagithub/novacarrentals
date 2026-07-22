import type { LucideIcon } from "lucide-react";
import { Mountain, Trees, Waves } from "lucide-react";

export type DestinationIconKey = "mountain" | "trees" | "waves";

export interface DestinationPark {
  name: string;
  highlight: string;
}

export interface DestinationCountry {
  name: string;
  tagline: string;
  description: string;
  icon: DestinationIconKey;
  cities: string[];
  parks: DestinationPark[];
  imgBg: string;
  coverImageUrl?: string | null;
  displayOrder?: number;
}

export interface DestinationAirport {
  city: string;
  country: string;
  code: string;
  airport: string;
}

export const DESTINATION_ICONS: Record<DestinationIconKey, LucideIcon> = {
  mountain: Mountain,
  trees: Trees,
  waves: Waves,
};

export const defaultCountries: DestinationCountry[] = [
  {
    name: "Rwanda",
    tagline: "The Land of a Thousand Hills",
    description:
      "From the vibrant capital Kigali to the misty volcanic slopes of the north and the shores of Lake Kivu, Rwanda is a nation of extraordinary beauty and remarkable accessibility. Our vehicles navigate every road — from smooth city boulevards to rugged highland tracks.",
    icon: "mountain",
    cities: ["Kigali", "Musanze", "Rubavu", "Huye", "Rusizi", "Nyagatare"],
    parks: [
      { name: "Volcanoes National Park", highlight: "Gorilla Trekking" },
      { name: "Akagera National Park", highlight: "Big Five Safari" },
      { name: "Nyungwe National Park", highlight: "Chimpanzees & Canopy Walk" },
      { name: "Lake Kivu", highlight: "Scenic Lakeside Drive" },
    ],
    imgBg: "bg-gradient-to-br from-green-900/30 to-background",
  },
  {
    name: "Uganda",
    tagline: "The Pearl of Africa",
    description:
      "Uganda's extraordinary biodiversity makes it one of Africa's premier wildlife destinations. Trek with mountain gorillas in Bwindi, cruise down the Nile from Jinja, or witness the thundering Murchison Falls. Our 4x4 fleet handles the terrain with ease.",
    icon: "trees",
    cities: ["Kampala", "Entebbe", "Jinja", "Mbarara", "Kabale"],
    parks: [
      { name: "Bwindi Impenetrable Forest", highlight: "Mountain Gorillas" },
      { name: "Queen Elizabeth National Park", highlight: "Tree-climbing Lions" },
      { name: "Murchison Falls National Park", highlight: "Murchison Falls" },
      { name: "Kibale National Park", highlight: "Chimpanzee Trekking" },
    ],
    imgBg: "bg-gradient-to-br from-emerald-900/30 to-background",
  },
  {
    name: "Tanzania",
    tagline: "Africa's Untamed Frontier",
    description:
      "Tanzania is home to some of the world's most iconic natural wonders — the Serengeti, Kilimanjaro, the Ngorongoro Crater, and Zanzibar's white-sand shores. Our vehicles give you access to it all, from the urban energy of Dar es Salaam to the remotest corners of the savanna.",
    icon: "waves",
    cities: ["Dar es Salaam", "Arusha", "Moshi", "Mwanza", "Dodoma", "Zanzibar"],
    parks: [
      { name: "Serengeti National Park", highlight: "Great Migration" },
      { name: "Ngorongoro Conservation Area", highlight: "Crater Safari" },
      { name: "Tarangire National Park", highlight: "Elephant Herds" },
      { name: "Mount Kilimanjaro", highlight: "Africa's Highest Peak" },
    ],
    imgBg: "bg-gradient-to-br from-amber-900/30 to-background",
  },
];

export const defaultAirports: DestinationAirport[] = [
  { city: "Kigali", country: "Rwanda", code: "KGL", airport: "Kigali International Airport" },
  { city: "Entebbe", country: "Uganda", code: "EBB", airport: "Entebbe International Airport" },
  { city: "Dar es Salaam", country: "Tanzania", code: "DAR", airport: "Julius Nyerere International Airport" },
  { city: "Arusha", country: "Tanzania", code: "ARK", airport: "Arusha Airport" },
  { city: "Zanzibar", country: "Tanzania", code: "ZNZ", airport: "Abeid Amani Karume International" },
  { city: "Mwanza", country: "Tanzania", code: "MWZ", airport: "Mwanza Airport" },
];

export const defaultDestinationsHero = {
  eyebrow: "Destinations",
  title: "One Fleet.\nThree Countries.",
  intro:
    "NOVACAR RENTALS operates across Rwanda, Uganda, and Tanzania — giving you the freedom to cross borders, follow the migration, climb the volcano, or simply explore at your own pace.",
};

export const defaultAirportsSection = {
  eyebrow: "Airport Coverage",
  title: "We Cover Every Major Airport",
  intro: "Our drivers monitor your flight in real time. We'll be there, whether you land on schedule or not.",
};

export const defaultCrossBorder = {
  eyebrow: "Cross-Border Travel",
  title: "Seamless Border Crossings",
  description:
    "All required documentation, cross-border permits, and insurance are handled by our team. You focus on the journey — we handle the paperwork.",
  button: "Plan Your Multi-Country Trip",
};
