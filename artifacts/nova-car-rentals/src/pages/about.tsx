import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Heart, Globe, Zap, CheckCircle2, ArrowRight, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Shield,
    title: "Safety First",
    desc: "Every vehicle is fully insured, regularly serviced, and inspected before every rental. Our maintenance standards exceed regional requirements.",
  },
  {
    icon: Heart,
    title: "Customer Obsession",
    desc: "From the first inquiry to the final drop-off, we treat every traveler like our most important guest. No hidden charges, no unpleasant surprises.",
  },
  {
    icon: Globe,
    title: "Regional Expertise",
    desc: "We know the roads of Rwanda, Uganda, and Tanzania like the back of our hand — from the smooth highways of Kigali to the red dirt tracks of Bwindi.",
  },
  {
    icon: Zap,
    title: "Reliable & Responsive",
    desc: "24/7 availability, real-time communication, and a team that actually picks up the phone. When you need us, we're there.",
  },
];

const promises = [
  "Transparent pricing — what you see is what you pay",
  "No hidden charges or surprise fees",
  "Dependable support before, during, and after your journey",
  "Professionally cleaned vehicles before every rental",
  "24/7 roadside emergency assistance",
  "Multilingual team: English, French, Kinyarwanda, Swahili",
  "Easy online booking with fast confirmation",
  "Cross-border documentation fully handled",
];

const stats = [
  { label: "Years of Service", value: "8+" },
  { label: "Vehicles in Fleet", value: "150+" },
  { label: "Happy Clients", value: "10k+" },
  { label: "Countries Covered", value: "3" },
];

const testimonials = [
  {
    name: "Dr. Sarah K.",
    role: "NGO Program Director, Kampala",
    text: "NOVACAR has been our go-to fleet partner for three years. Their vehicles are always impeccable and their response time is unmatched. I wouldn't trust anyone else with our team's logistics.",
  },
  {
    name: "James T.",
    role: "Wildlife Photographer, UK",
    text: "I rented a Land Cruiser for a two-week Serengeti photography tour. The vehicle never let me down, the driver knew exactly where to position for the best shots, and the price was fair. Outstanding.",
  },
  {
    name: "Marie-Claire B.",
    role: "Business Executive, Brussels",
    text: "The airport transfer from Kigali was seamless — driver on time, professional, spoke French and English. The executive sedan was spotless. I'll use NOVACAR every time I'm in Rwanda.",
  },
];

export default function About() {
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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">About NOVACAR</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              Built on Trust.<br />Driven by Passion.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              NOVACAR RENTALS was founded on a simple belief: that travelers in East Africa deserve a rental experience as professional and reliable as anywhere else in the world. We built that experience — one vehicle at a time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/50">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center text-center py-8 px-6"
              >
                <span className="text-4xl font-display font-bold text-foreground mb-1">{stat.value}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Story</span>
              <h2 className="text-4xl font-display font-bold mt-3 mb-6">
                From Kigali to the Serengeti and Back
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  NOVACAR RENTALS began in Kigali, Rwanda, with a small fleet of vehicles and a big commitment: to be the most reliable car rental partner in East Africa. We understood that visitors to the region needed more than just a car — they needed confidence that the vehicle would perform on every type of road, and that someone would be there if it didn't.
                </p>
                <p>
                  Over the years, we've grown from a local operation into a regional fleet spanning Rwanda, Uganda, and Tanzania. We've transported safari-goers to the Serengeti at dawn, delivered diplomats to summits in Kampala, driven families up to Volcanoes National Park for once-in-a-lifetime gorilla encounters, and handled airport transfers for thousands of international travelers.
                </p>
                <p>
                  Through it all, our promise has never changed: transparent pricing, immaculate vehicles, professional service, and the peace of mind that comes from knowing someone has your back — 24 hours a day, across three countries.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-card border border-border flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-muted/20">RW</span>
                  </div>
                  <div className="aspect-square bg-primary/10 border border-primary/20 flex items-center justify-center p-6">
                    <p className="text-center text-sm font-medium text-primary leading-snug">
                      "Customer satisfaction is our highest priority."
                    </p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square bg-card border border-border flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-muted/20">UG</span>
                  </div>
                  <div className="aspect-[3/4] bg-muted border border-border flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-muted-foreground/20">TZ</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Values</span>
            <h2 className="text-4xl font-display font-bold mt-3">What We Stand For</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                data-testid={`card-value-${i}`}
                className="bg-background border border-border p-8 group hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-card flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Promise</span>
              <h2 className="text-4xl font-display font-bold mt-3 mb-8">
                The NOVACAR Commitment
              </h2>
              <ul className="space-y-4">
                {promises.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <span className="text-primary font-bold text-sm uppercase tracking-widest">What Clients Say</span>
              {testimonials.map((t, i) => (
                <div key={i} data-testid={`card-testimonial-${i}`} className="bg-card border border-border p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div>
                    <p className="font-display font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">Ready to Experience NOVACAR?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Book your vehicle today and discover why thousands of travelers, businesses, and organizations trust us across East Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 font-display font-semibold uppercase tracking-wider border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  data-testid="button-about-book"
                >
                  Book a Vehicle
                </Button>
              </Link>
              <Link href="/fleet">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 px-10 font-display font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-about-fleet"
                >
                  View Fleet <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
