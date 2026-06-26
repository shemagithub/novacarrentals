import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, ArrowRight, Mountain, Trees, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

const countries = [
  {
    name: "Rwanda",
    tagline: "The Land of a Thousand Hills",
    description:
      "From the vibrant capital Kigali to the misty volcanic slopes of the north and the shores of Lake Kivu, Rwanda is a nation of extraordinary beauty and remarkable accessibility. Our vehicles navigate every road — from smooth city boulevards to rugged highland tracks.",
    icon: Mountain,
    cities: ["Kigali", "Musanze", "Rubavu", "Huye", "Rusizi", "Nyagatare"],
    parks: [
      { name: "Volcanoes National Park", highlight: "Gorilla Trekking" },
      { name: "Akagera National Park", highlight: "Big Five Safari" },
      { name: "Nyungwe National Park", highlight: "Chimpanzees & Canopy Walk" },
      { name: "Lake Kivu", highlight: "Scenic Lakeside Drive" },
    ],
    color: "from-primary/20 to-transparent",
    imgBg: "bg-gradient-to-br from-green-900/30 to-background",
  },
  {
    name: "Uganda",
    tagline: "The Pearl of Africa",
    description:
      "Uganda's extraordinary biodiversity makes it one of Africa's premier wildlife destinations. Trek with mountain gorillas in Bwindi, cruise down the Nile from Jinja, or witness the thundering Murchison Falls. Our 4x4 fleet handles the terrain with ease.",
    icon: Trees,
    cities: ["Kampala", "Entebbe", "Jinja", "Mbarara", "Kabale"],
    parks: [
      { name: "Bwindi Impenetrable Forest", highlight: "Mountain Gorillas" },
      { name: "Queen Elizabeth National Park", highlight: "Tree-climbing Lions" },
      { name: "Murchison Falls National Park", highlight: "Murchison Falls" },
      { name: "Kibale National Park", highlight: "Chimpanzee Trekking" },
    ],
    color: "from-emerald-900/20 to-transparent",
    imgBg: "bg-gradient-to-br from-emerald-900/30 to-background",
  },
  {
    name: "Tanzania",
    tagline: "Africa's Untamed Frontier",
    description:
      "Tanzania is home to some of the world's most iconic natural wonders — the Serengeti, Kilimanjaro, the Ngorongoro Crater, and Zanzibar's white-sand shores. Our vehicles give you access to it all, from the urban energy of Dar es Salaam to the remotest corners of the savanna.",
    icon: Waves,
    cities: ["Dar es Salaam", "Arusha", "Moshi", "Mwanza", "Dodoma", "Zanzibar"],
    parks: [
      { name: "Serengeti National Park", highlight: "Great Migration" },
      { name: "Ngorongoro Conservation Area", highlight: "Crater Safari" },
      { name: "Tarangire National Park", highlight: "Elephant Herds" },
      { name: "Mount Kilimanjaro", highlight: "Africa's Highest Peak" },
    ],
    color: "from-amber-900/20 to-transparent",
    imgBg: "bg-gradient-to-br from-amber-900/30 to-background",
  },
];

const airports = [
  { city: "Kigali", country: "Rwanda", code: "KGL", airport: "Kigali International Airport" },
  { city: "Entebbe", country: "Uganda", code: "EBB", airport: "Entebbe International Airport" },
  { city: "Dar es Salaam", country: "Tanzania", code: "DAR", airport: "Julius Nyerere International Airport" },
  { city: "Arusha", country: "Tanzania", code: "ARK", airport: "Arusha Airport" },
  { city: "Zanzibar", country: "Tanzania", code: "ZNZ", airport: "Abeid Amani Karume International" },
  { city: "Mwanza", country: "Tanzania", code: "MWZ", airport: "Mwanza Airport" },
];

export default function Destinations() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Destinations</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              One Fleet.<br />Three Countries.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              NOVACAR RENTALS operates across Rwanda, Uganda, and Tanzania — giving you the freedom to cross borders, follow the migration, climb the volcano, or simply explore at your own pace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {countries.map((country, ci) => (
            <motion.div
              key={ci}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.1 }}
              data-testid={`card-country-${ci}`}
              className="bg-card border border-border overflow-hidden"
            >
              <div className="grid lg:grid-cols-[1fr_1.4fr] gap-0">
                {/* Country Info */}
                <div className={`${country.imgBg} p-10 flex flex-col justify-between gap-8 min-h-[340px] border-b lg:border-b-0 lg:border-r border-border`}>
                  <div>
                    <country.icon className="w-8 h-8 text-primary mb-4" />
                    <h2 className="text-4xl font-display font-bold mb-2">{country.name}</h2>
                    <p className="text-primary font-semibold text-sm mb-6">{country.tagline}</p>
                    <p className="text-muted-foreground leading-relaxed text-sm">{country.description}</p>
                  </div>
                  <Link href="/contact">
                    <Button
                      className="gap-2 font-display uppercase tracking-wider text-xs w-full sm:w-auto"
                      data-testid={`button-book-${country.name.toLowerCase()}`}
                    >
                      Book in {country.name} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                {/* Cities and Parks */}
                <div className="p-10 grid sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Cities We Serve</h3>
                    <ul className="space-y-2.5">
                      {country.cities.map((city, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {city}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Parks & Natural Wonders</h3>
                    <ul className="space-y-3.5">
                      {country.parks.map((park, j) => (
                        <li key={j} className="text-sm">
                          <span className="text-foreground font-medium block">{park.name}</span>
                          <span className="text-primary text-xs font-semibold uppercase tracking-wider">{park.highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Airport Transfers */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Airport Coverage</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-4">We Cover Every Major Airport</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our drivers monitor your flight in real time. We'll be there, whether you land on schedule or not.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {airports.map((ap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                data-testid={`card-airport-${i}`}
                className="bg-background border border-border p-5 flex items-start gap-4 group hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-card flex items-center justify-center shrink-0 font-display font-bold text-primary text-sm border border-border">
                  {ap.code}
                </div>
                <div>
                  <p className="font-display font-bold text-base">{ap.city}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ap.airport}</p>
                  <span className="text-xs text-primary font-semibold uppercase tracking-wider">{ap.country}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-border CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Cross-Border Travel</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-4">Seamless Border Crossings</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              All required documentation, cross-border permits, and insurance are handled by our team. You focus on the journey — we handle the paperwork.
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 font-display font-semibold uppercase tracking-wider" data-testid="button-crossborder">
                Plan Your Multi-Country Trip
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
