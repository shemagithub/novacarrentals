import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Map, Clock, Star, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.png" 
            alt="Cinematic 4x4 SUV in East African savanna at golden hour" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Rwanda • Uganda • Tanzania
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.1] mb-6">
              The Drive of a <span className="text-primary italic">Lifetime.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed font-light">
              Premium car rental built for adventure. From executive airport transfers to rugged safaris across the savanna. Your journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-display font-semibold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground">
                  Book Your Vehicle
                </Button>
              </Link>
              <Link href="/fleet">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-display font-semibold uppercase tracking-wider border-border hover:bg-card">
                  Explore Fleet
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
            {[
              { label: "Happy Travelers", value: "10k+", icon: Star },
              { label: "Vehicles in Fleet", value: "150+", icon: CarFront },
              { label: "Support", value: "24/7", icon: Clock },
              { label: "Destinations", value: "3 Countries", icon: Map },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col items-center justify-center text-center ${i === 0 ? 'border-none' : ''}`}
              >
                <stat.icon className="w-6 h-6 text-primary mb-3 opacity-80" />
                <span className="text-3xl font-display font-bold text-foreground mb-1">{stat.value}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">The Novacar Standard</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-6">Uncompromising Quality for Every Journey.</h3>
            <p className="text-muted-foreground text-lg">We don't just rent cars. We provide peace of mind for your East African expedition, business trip, or daily commute.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Immaculate Fleet", desc: "Every vehicle is rigorously maintained, fully insured, and detailed before handoff.", icon: Shield },
              { title: "Cross-Border Freedom", desc: "Seamless travel between Rwanda, Uganda, and Tanzania with proper documentation.", icon: Map },
              { title: "24/7 Roadside Assistance", desc: "No matter where the road takes you, our dedicated support team is one call away.", icon: Clock },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-8 border border-border group hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 bg-background rounded-none flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-display font-bold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Preview */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Our Vehicles</h2>
              <h3 className="text-4xl font-display font-bold">The Perfect Vehicle for Your Next Adventure.</h3>
            </div>
            <Link href="/fleet">
              <Button variant="outline" className="gap-2 font-display uppercase tracking-wide">
                View All Vehicles <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Luxury 4x4 SUV", type: "Toyota Land Cruiser", img: "/images/fleet-suv.png", price: "$120" },
              { name: "Executive Sedan", type: "Mercedes E-Class", img: "/images/fleet-sedan.png", price: "$85" },
              { name: "Safari Van", type: "Custom Pop-up Roof", img: "/images/fleet-van.png", price: "$100" },
            ].map((car, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer bg-background border border-border overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={car.img} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 text-sm font-bold">
                    From {car.price}<span className="text-muted-foreground font-normal text-xs">/day</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{car.type}</p>
                  <h4 className="text-xl font-display font-bold mb-4">{car.name}</h4>
                  <div className="flex items-center text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Reserve Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Teaser */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Explore East Africa</h2>
                <h3 className="text-4xl md:text-5xl font-display font-bold leading-tight">One Region. Endless Possibilities.</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're navigating the pristine streets of Kigali, exploring the vast plains of the Serengeti, or trekking to see gorillas in Uganda, our vehicles provide the reliability you need.
              </p>
              <ul className="space-y-4">
                {['Rwanda (Kigali, Volcanoes NP, Akagera)', 'Uganda (Kampala, Bwindi, Queen Elizabeth)', 'Tanzania (Dar es Salaam, Serengeti, Ngorongoro)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/destinations" className="inline-block">
                <Button size="lg" className="h-14 px-8 text-base font-display font-semibold uppercase tracking-wider">
                  View Destinations
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative h-[600px]"
            >
              <div className="absolute inset-0 bg-primary/10 -ml-6 mt-6 border border-primary/20" />
              <img src="/images/rwanda.png" alt="Rwanda Landscape" className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700 border border-border" />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
