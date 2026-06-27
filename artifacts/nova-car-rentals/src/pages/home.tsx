import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2, Shield, Map, Clock,
  Star, CarFront, Phone, Zap, Users, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCalculator } from "@/components/PricingCalculator";
import { useLang } from "@/contexts/LanguageContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

export default function Home() {
  const { t } = useLang();

  const services = [
    { title: "Self-Drive", desc: "Take the wheel across Rwanda, Uganda and Tanzania at your own pace.", href: "/services" },
    { title: "Chauffeur-Driven", desc: "Professional multilingual drivers who know every road in East Africa.", href: "/services" },
    { title: "Safari Vehicles", desc: "Fully equipped 4x4s with popup roofs for wildlife photography and game drives.", href: "/services" },
    { title: "Airport Transfers", desc: "Real-time flight monitoring. Your driver is always waiting.", href: "/services" },
    { title: "Corporate Fleet", desc: "Flexible fleet solutions for NGOs, embassies, and international organisations.", href: "/services" },
    { title: "Long-Term Leasing", desc: "Cost-effective monthly leasing with full maintenance included.", href: "/services" },
  ];

  const whyUs = [
    { icon: Shield, title: "Fully Insured & Serviced", desc: "Every vehicle passes strict maintenance checks before each rental." },
    { icon: Globe, title: "Cross-Border Coverage", desc: "Seamless travel between Rwanda, Uganda, and Tanzania with all paperwork handled." },
    { icon: Clock, title: "24/7 Roadside Support", desc: "A dedicated team available around the clock wherever the road takes you." },
    { icon: Zap, title: "Fast Confirmation", desc: "Submit your inquiry and receive full booking confirmation within 2 hours." },
    { icon: Users, title: "Multilingual Drivers", desc: "English, French, Kinyarwanda, and Swahili-speaking drivers available." },
    { icon: Phone, title: "WhatsApp Booking", desc: "Chat directly with our team for the fastest possible response and quote." },
  ];

  const fleetTeaser = [
    { name: "Toyota Land Cruiser V8", type: "4x4 Safari", price: "120", badge: "Most Popular" },
    { name: "Toyota Prado", type: "4x4 SUV", price: "110", badge: "" },
    { name: "Safari Van (Popup Roof)", type: "Wildlife Photography", price: "130", badge: "Safari Ready" },
    { name: "Executive Sedan", type: "Business / Airport", price: "70", badge: "" },
  ];

  const stats = [
    { label: t("stat_travelers"), value: "10,000+", icon: Star },
    { label: t("stat_vehicles"), value: "150+", icon: CarFront },
    { label: t("stat_support"), value: "24/7", icon: Clock },
    { label: t("stat_countries"), value: "3", icon: Map },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ─── HERO ─── */}
      <section className="relative h-screen min-h-[640px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.png"
            alt="Toyota Land Cruiser on East African savanna at golden hour"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t("hero_badge")}
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.05] mb-6">
                {t("hero_headline_1")}{" "}
                <span className="text-primary italic block md:inline">{t("hero_headline_2")}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/75 mb-10 leading-relaxed font-light max-w-xl">
                {t("hero_sub")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-9 text-sm font-display font-bold uppercase tracking-widest shadow-lg shadow-primary/30"
                    data-testid="button-hero-book"
                  >
                    {t("hero_cta_book")}
                  </Button>
                </Link>
                <Link href="/fleet">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-9 text-sm font-display font-semibold uppercase tracking-wider border-foreground/20 hover:bg-card"
                    data-testid="button-hero-fleet"
                  >
                    {t("hero_cta_fleet")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Calculator pinned in hero on large screens */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <PricingCalculator />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/40">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.08)}
                className="flex flex-col items-center justify-center text-center py-6 px-4"
                data-testid={`stat-${i}`}
              >
                <stat.icon className="w-5 h-5 text-primary mb-3 opacity-80" />
                <span className="text-3xl font-display font-bold text-foreground mb-0.5">{stat.value}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">{t("services_label")}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3">
              {t("services_headline")}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {services.map((s, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.06)}
                data-testid={`service-tile-${i}`}
                className="bg-background p-8 group hover:bg-card transition-colors relative"
              >
                <div className="absolute top-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500" />
                <h3 className="text-lg font-display font-bold mb-3 group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
                <Link href={s.href} className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary gap-1.5 hover:gap-3 transition-all">
                  Learn More <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY NOVACAR ─── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
            <motion.div {...fadeUp()}>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">{t("why_label")}</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-6 leading-tight">
                {t("why_headline")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {t("why_sub")}
              </p>
              <Link href="/about">
                <Button variant="outline" className="gap-2 font-display uppercase tracking-wider text-xs h-11" data-testid="button-about">
                  {t("why_story")} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {whyUs.map((item, i) => (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.07)}
                  data-testid={`why-card-${i}`}
                  className="bg-background border border-border p-6 group hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-card flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-sm mb-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FLEET TEASER ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">{t("fleet_label")}</span>
              <h2 className="text-4xl font-display font-bold mt-3">{t("fleet_headline")}</h2>
            </div>
            <Link href="/fleet">
              <Button variant="outline" className="gap-2 font-display uppercase tracking-wide text-xs" data-testid="button-view-fleet">
                {t("fleet_cta")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {fleetTeaser.map((car, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.08)}
                data-testid={`fleet-card-${i}`}
                className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-background/80 flex items-center justify-center">
                    <CarFront className="w-14 h-14 text-muted-foreground/15" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 text-sm font-bold">
                    {t("fleet_from")} ${car.price}<span className="text-muted-foreground font-normal text-xs">{t("fleet_day")}</span>
                  </div>
                  {car.badge && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                      {car.badge}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{car.type}</p>
                  <h3 className="font-display font-bold text-base mb-4">{car.name}</h3>
                  <Link href="/contact" className="flex items-center text-xs font-bold uppercase tracking-wider gap-1.5 group-hover:text-primary transition-colors hover:gap-2.5">
                    {t("fleet_reserve")} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS TEASER ─── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()} className="space-y-7">
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">{t("dest_label")}</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 leading-tight">
                  {t("dest_headline").split(".")[0]}.<br />{t("dest_headline").split(".")[1]?.trim()}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("dest_sub")}
              </p>
              <ul className="space-y-3.5">
                {[
                  { text: "Rwanda — Kigali, Volcanoes NP, Akagera, Lake Kivu" },
                  { text: "Uganda — Kampala, Bwindi, Queen Elizabeth NP" },
                  { text: "Tanzania — Dar es Salaam, Serengeti, Kilimanjaro, Zanzibar" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
              <Link href="/destinations">
                <Button size="lg" className="h-13 px-8 text-sm font-display font-bold uppercase tracking-widest" data-testid="button-destinations">
                  {t("dest_cta")}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[520px]"
            >
              <div className="absolute inset-6 border border-primary/15 bg-primary/5" />
              <img
                src="/images/rwanda.png"
                alt="East African landscape"
                className="absolute inset-0 w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 border border-border"
              />
              <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur border border-border p-4 max-w-[200px]">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Cross-Border Ready</p>
                <p className="text-xs text-muted-foreground">All permits and documentation handled for you</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CALCULATOR (mobile/standalone) ─── */}
      <section className="py-24 bg-background lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl font-display font-bold mt-3">Estimate Your Rental Cost</h2>
          </motion.div>
          <div className="max-w-lg mx-auto">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* ─── PROMISE STRIP ─── */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp()}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
                {t("promise_headline")}
              </h2>
              <p className="text-primary-foreground/70 text-lg">
                {t("promise_sub")}
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 font-display font-bold uppercase tracking-widest border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  data-testid="button-cta-book"
                >
                  {t("promise_book")}
                </Button>
              </Link>
              <Link href="/fleet">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-13 px-8 font-display font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-cta-fleet"
                >
                  {t("promise_fleet")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
