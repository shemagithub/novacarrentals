import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Users, Briefcase, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

const vehicles = [
  {
    category: "Safari & 4x4",
    items: [
      { name: "Toyota Land Cruiser V8", type: "4x4 Safari", price: "120", passengers: 7, bags: 4, fuel: "Diesel", tags: ["Safari Ready", "Most Popular"] },
      { name: "Toyota Prado", type: "4x4 SUV", price: "110", passengers: 7, bags: 3, fuel: "Diesel", tags: ["Off-Road"] },
      { name: "Toyota Fortuner", type: "4x4 SUV", price: "95", passengers: 7, bags: 3, fuel: "Diesel", tags: [] },
      { name: "Toyota Hilux Double Cab", type: "4x4 Pickup", price: "85", passengers: 5, bags: 4, fuel: "Diesel", tags: ["Work Ready"] },
    ],
  },
  {
    category: "Executive & Luxury",
    items: [
      { name: "Toyota Camry", type: "Executive Sedan", price: "70", passengers: 5, bags: 3, fuel: "Petrol", tags: ["Business"] },
      { name: "Mercedes E-Class", type: "Luxury Sedan", price: "150", passengers: 4, bags: 2, fuel: "Petrol", tags: ["Premium", "VIP"] },
      { name: "BMW 5 Series", type: "Luxury Sedan", price: "140", passengers: 4, bags: 2, fuel: "Petrol", tags: ["Premium"] },
      { name: "Range Rover Sport", type: "Luxury SUV", price: "200", passengers: 5, bags: 3, fuel: "Diesel", tags: ["Luxury", "VIP"] },
    ],
  },
  {
    category: "Economy & Compact",
    items: [
      { name: "Toyota RAV4", type: "Compact SUV", price: "75", passengers: 5, bags: 2, fuel: "Petrol", tags: ["Bestseller"] },
      { name: "Toyota Corolla", type: "Compact Car", price: "45", passengers: 5, bags: 2, fuel: "Petrol", tags: ["Affordable"] },
      { name: "Nissan Note", type: "Economy Car", price: "35", passengers: 5, bags: 1, fuel: "Petrol", tags: ["Budget Friendly"] },
      { name: "Toyota Vitz", type: "Economy Car", price: "30", passengers: 4, bags: 1, fuel: "Petrol", tags: [] },
    ],
  },
  {
    category: "Vans, Buses & Groups",
    items: [
      { name: "Toyota Hiace Van", type: "Passenger Van", price: "90", passengers: 14, bags: 6, fuel: "Diesel", tags: ["Group Travel"] },
      { name: "Rosa Coaster Bus", type: "Minibus", price: "130", passengers: 30, bags: 10, fuel: "Diesel", tags: ["Groups", "Conferences"] },
      { name: "Safari Minivan (Popup)", type: "Safari Vehicle", price: "100", passengers: 7, bags: 4, fuel: "Diesel", tags: ["Safari", "Photography"] },
      { name: "Luxury Wedding Car", type: "VIP / Wedding", price: "180", passengers: 4, bags: 2, fuel: "Petrol", tags: ["Wedding", "Special Occasions"] },
    ],
  },
];

export default function Fleet() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Fleet</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              The Right Vehicle<br />for Every Journey.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From rugged 4x4 safari vehicles to executive sedans and group transport, every vehicle in our fleet is professionally maintained, fully insured, and ready for East Africa's roads.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Fleet Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {vehicles.map((group, gi) => (
            <div key={gi}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-10"
              >
                <h2 className="text-2xl font-display font-bold text-foreground">{group.category}</h2>
                <div className="flex-1 h-px bg-border" />
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {group.items.map((car, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    data-testid={`card-vehicle-${gi}-${i}`}
                    className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end p-4">
                        <div className="bg-background/90 backdrop-blur px-3 py-1 text-sm font-bold">
                          From ${car.price}<span className="text-muted-foreground font-normal text-xs">/day</span>
                        </div>
                      </div>
                      {car.tags.length > 0 && (
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                          {car.tags.slice(0, 1).map((tag) => (
                            <span key={tag} className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <span className="text-5xl opacity-10 font-display font-bold">{car.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{car.type}</p>
                      <h3 className="text-base font-display font-bold mb-4 group-hover:text-primary transition-colors">{car.name}</h3>
                      <div className="flex gap-4 text-xs text-muted-foreground mb-5 mt-auto">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {car.passengers} seats</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {car.bags} bags</span>
                        <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {car.fuel}</span>
                      </div>
                      <Link href="/contact">
                        <Button
                          size="sm"
                          className="w-full font-display uppercase tracking-wider text-xs h-10 group/btn"
                          data-testid={`button-reserve-${gi}-${i}`}
                        >
                          Request Vehicle
                          <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Availability Calendar */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AvailabilityCalendar />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">Need a Custom Fleet Solution?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Corporate clients, NGOs, and government institutions can access long-term leasing and tailored fleet packages.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 font-display font-semibold uppercase tracking-wider text-sm border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                data-testid="button-custom-fleet"
              >
                Contact Our Team
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
