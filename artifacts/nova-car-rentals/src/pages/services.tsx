import { motion } from "framer-motion";
import { Link } from "wouter";
import { Car, UserCheck, Plane, Building2, Camera, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Car,
    title: "Self-Drive Car Rental",
    tagline: "Freedom to explore at your pace",
    desc: "Take the wheel and discover East Africa on your own terms. Perfect for tourists, business professionals, NGOs, expatriates, and residents who prefer independence.",
    perks: [
      "Flexible pick-up and drop-off locations",
      "No minimum duration requirements",
      "Comprehensive insurance included",
      "GPS navigation available on request",
      "24/7 roadside emergency support",
      "Cross-border documentation handled",
    ],
    cta: "Book Self-Drive",
    accent: "22 85% 55%",
  },
  {
    icon: UserCheck,
    title: "Chauffeur-Driven Car Hire",
    tagline: "Professional drivers, professional service",
    desc: "Travel in complete comfort with experienced, professional drivers who know every road across Rwanda, Uganda, and Tanzania. Arrive relaxed, every time.",
    perks: [
      "Vetted, multilingual professional drivers",
      "Punctual and discreet service",
      "Airport meet-and-greet service",
      "Half-day and full-day hire options",
      "Ideal for executives and VIP guests",
      "Available for corporate events and conferences",
    ],
    cta: "Book Chauffeur",
    accent: "150 20% 40%",
  },
  {
    icon: Plane,
    title: "Airport Transfers",
    tagline: "Reliable, on time, every flight",
    desc: "Stress-free arrivals and departures. We monitor your flight in real time and guarantee your driver will be waiting — whether you're arriving in Kigali, Entebbe, Dar es Salaam, or beyond.",
    perks: [
      "Real-time flight monitoring",
      "Meet & greet with name board",
      "Kigali, Entebbe, Dar es Salaam, Arusha, Zanzibar",
      "Fixed pricing — no surge fees",
      "Prompt, door-to-door service",
      "Available 24 hours a day",
    ],
    cta: "Book Airport Transfer",
    accent: "22 85% 55%",
  },
  {
    icon: Building2,
    title: "Corporate Car Rental",
    tagline: "Fleet solutions for businesses and organizations",
    desc: "Flexible transport for businesses, embassies, NGOs, government institutions, international organizations, and conference delegates. Invoiced accounts and fleet management available.",
    perks: [
      "Dedicated account management",
      "Monthly invoicing available",
      "Executive sedans, SUVs, and vans",
      "Conference and event transportation",
      "Embassy and diplomatic transport",
      "Scalable — 1 vehicle to full fleet",
    ],
    cta: "Request Corporate Quote",
    accent: "150 20% 40%",
  },
  {
    icon: Camera,
    title: "Safari Vehicle Rental",
    tagline: "Built for the wild",
    desc: "Fully equipped 4x4 safari vehicles ideal for national park game drives, wildlife photography tours, camping trips, gorilla trekking, and adventure travel across East Africa's greatest parks.",
    perks: [
      "Pop-up roof for wildlife photography",
      "Extended fuel range for remote areas",
      "Refrigerator and camping equipment available",
      "Experienced safari driver-guides",
      "All major parks: Serengeti, Bwindi, Akagera",
      "Park permits and logistics assistance",
    ],
    cta: "Book Safari Vehicle",
    accent: "22 85% 55%",
  },
  {
    icon: CalendarDays,
    title: "Long-Term Car Leasing",
    tagline: "Cost-effective for extended stays",
    desc: "Cost-effective vehicle leasing for businesses, development projects, consultants, and long-stay visitors. Monthly rates with flexible terms and full maintenance coverage included.",
    perks: [
      "Weekly and monthly pricing tiers",
      "Full maintenance and servicing included",
      "Swap vehicle if needed during lease",
      "Insurance and roadside assist included",
      "Perfect for expats and project staff",
      "Dedicated fleet manager assigned",
    ],
    cta: "Get Leasing Quote",
    accent: "150 20% 40%",
  },
];

const perfectFor = [
  "Business Travel", "Family Vacations", "Safari Tours", "Gorilla Trekking",
  "Wedding Transportation", "Conference Transportation", "NGO Fleet Hire",
  "Diplomatic Missions", "Student Transport", "Airport Transfers",
  "Cross-Border Road Trips", "Tourism and Adventure",
];

export default function Services() {
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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Services</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              Every Journey,<br />Fully Covered.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Whether you need a quick city transfer, a weeklong safari expedition, or a long-term corporate fleet — we have a service tailored to your exact needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                data-testid={`card-service-${i}`}
                className="group bg-card border border-border hover:border-primary/40 transition-all duration-300 overflow-hidden"
              >
                <div className="grid md:grid-cols-[1fr_1.5fr] gap-0">
                  <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between gap-6">
                    <div>
                      <div className="w-14 h-14 bg-background flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <service.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-primary font-bold uppercase tracking-widest block mb-2">{service.tagline}</span>
                      <h2 className="text-2xl font-display font-bold mb-4">{service.title}</h2>
                      <p className="text-muted-foreground leading-relaxed">{service.desc}</p>
                    </div>
                    <Link href="/contact">
                      <Button
                        className="gap-2 font-display uppercase tracking-wider text-xs w-full md:w-auto"
                        data-testid={`button-service-${i}`}
                      >
                        {service.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                  <div className="p-8 md:p-10">
                    <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-6">What's Included</h3>
                    <ul className="space-y-3.5">
                      {service.perks.map((perk, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Perfect For</span>
            <h2 className="text-4xl font-display font-bold mt-3">Who We Serve</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {perfectFor.map((item, i) => (
              <span
                key={i}
                className="px-5 py-2.5 bg-background border border-border text-sm text-foreground font-medium hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-4">Not Sure Which Service You Need?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Our team will help you find the right vehicle and service for your journey. No obligation — just expert advice.
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 font-display font-semibold uppercase tracking-wider" data-testid="button-contact-services">
                Talk to Our Team
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
