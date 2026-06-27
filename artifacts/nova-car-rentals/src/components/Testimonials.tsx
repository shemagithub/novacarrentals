import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export interface Review {
  name: string;
  role: string;
  country: string;
  flag: string;
  rating: number;
  text: string;
  vehicle: string;
  date: string;
  initials: string;
  avatarColor: string;
}

export const allReviews: Review[] = [
  {
    name: "Dr. Sarah K.",
    role: "NGO Program Director",
    country: "Uganda",
    flag: "🇺🇬",
    rating: 5,
    text: "NOVACAR has been our go-to fleet partner for three years. Their vehicles are always impeccable and their response time is unmatched. I wouldn't trust anyone else with our team's logistics across Rwanda and Uganda.",
    vehicle: "Toyota Land Cruiser V8",
    date: "March 2026",
    initials: "SK",
    avatarColor: "bg-blue-600",
  },
  {
    name: "James T.",
    role: "Wildlife Photographer",
    country: "United Kingdom",
    flag: "🇬🇧",
    rating: 5,
    text: "I rented a Safari Van for a two-week Serengeti photography tour. The popup roof was perfect. The driver knew exactly where to position for the best shots at golden hour. Price was fair for the experience delivered.",
    vehicle: "Safari Van (Popup Roof)",
    date: "January 2026",
    initials: "JT",
    avatarColor: "bg-emerald-600",
  },
  {
    name: "Marie-Claire B.",
    role: "Business Executive",
    country: "Belgium",
    flag: "🇧🇪",
    rating: 5,
    text: "The airport transfer from Kigali was seamless — driver on time, professional, spoke French and English. The Mercedes was spotless. I'll use NOVACAR every time I'm in Rwanda. Highly recommend to all colleagues.",
    vehicle: "Mercedes E-Class",
    date: "February 2026",
    initials: "MB",
    avatarColor: "bg-purple-600",
  },
  {
    name: "Emmanuel N.",
    role: "Safari Tour Operator",
    country: "Rwanda",
    flag: "🇷🇼",
    rating: 5,
    text: "I've worked with every rental company in Kigali. NOVACAR is in a different league. Their maintenance is exceptional, their communication is reliable, and they understand what professional safari operators actually need.",
    vehicle: "Toyota Land Cruiser V8",
    date: "April 2026",
    initials: "EN",
    avatarColor: "bg-amber-600",
  },
  {
    name: "Priya M.",
    role: "Research Scientist",
    country: "India",
    flag: "🇮🇳",
    rating: 5,
    text: "We hired four vehicles for a six-week field research project across Uganda and Tanzania. Every single vehicle performed without a single breakdown. The cross-border documentation was handled effortlessly by the team.",
    vehicle: "Toyota Fortuner",
    date: "December 2025",
    initials: "PM",
    avatarColor: "bg-rose-600",
  },
  {
    name: "Tom & Lisa R.",
    role: "Honeymooners",
    country: "Australia",
    flag: "🇦🇺",
    rating: 5,
    text: "We booked the chauffeur package for our honeymoon — Kigali, Volcanoes NP, then Lake Kivu. Our driver was warm, knowledgeable, and made the whole trip feel special. The Land Cruiser was spotless. 10/10.",
    vehicle: "Toyota Land Cruiser V8",
    date: "May 2026",
    initials: "TR",
    avatarColor: "bg-teal-600",
  },
  {
    name: "Ambassador O.",
    role: "Diplomatic Mission",
    country: "France",
    flag: "🇫🇷",
    rating: 5,
    text: "We require absolute punctuality and discretion for diplomatic transport. NOVACAR has never let us down. Their drivers are professional, vehicles immaculate, and they understand the requirements of high-protocol travel.",
    vehicle: "Range Rover Sport",
    date: "March 2026",
    initials: "AO",
    avatarColor: "bg-indigo-600",
  },
  {
    name: "David C.",
    role: "Overland Adventurer",
    country: "Canada",
    flag: "🇨🇦",
    rating: 5,
    text: "Solo drove a Toyota Prado from Kigali through Bwindi to Kampala and back. The vehicle was a beast — handled every mud track without complaint. NOVACAR's 24/7 support gave me confidence on remote routes.",
    vehicle: "Toyota Prado",
    date: "February 2026",
    initials: "DC",
    avatarColor: "bg-orange-600",
  },
  {
    name: "Fatima A.",
    role: "Conference Organiser",
    country: "Tanzania",
    flag: "🇹🇿",
    rating: 5,
    text: "Hired three Hiace vans for an international conference in Arusha — airport pickups, hotel transfers, day trips to Ngorongoro. The team was organised, flexible, and the vehicles were always on time. Will book again.",
    vehicle: "Toyota Hiace Van",
    date: "January 2026",
    initials: "FA",
    avatarColor: "bg-cyan-600",
  },
  {
    name: "Henrik L.",
    role: "Documentary Filmmaker",
    country: "Sweden",
    flag: "🇸🇪",
    rating: 5,
    text: "Eight weeks across three countries filming wildlife for a nature documentary. NOVACAR's safari van was our production vehicle — reliable, well-equipped, and the driver doubled as a brilliant local guide. Extraordinary service.",
    vehicle: "Safari Van (Popup Roof)",
    date: "November 2025",
    initials: "HL",
    avatarColor: "bg-lime-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, compact = false }: { review: Review; compact?: boolean }) {
  return (
    <div
      className={`bg-card border border-border flex-shrink-0 flex flex-col group hover:border-primary/40 transition-colors duration-300 ${
        compact ? "w-80 p-5" : "w-96 p-6"
      }`}
    >
      {/* Quote icon + stars */}
      <div className="flex items-start justify-between mb-4">
        <Quote className="w-6 h-6 text-primary/30 shrink-0" />
        <StarRating rating={review.rating} />
      </div>

      {/* Review text */}
      <p className={`text-muted-foreground leading-relaxed flex-1 mb-5 italic ${compact ? "text-xs" : "text-sm"}`}>
        "{review.text}"
      </p>

      {/* Vehicle tag */}
      <div className="mb-4">
        <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
          {review.vehicle}
        </span>
      </div>

      {/* Reviewer info */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className={`w-9 h-9 rounded-full ${review.avatarColor} flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-bold">{review.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground truncate">{review.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{review.role}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <span>{review.flag}</span>
          <span className="hidden sm:inline text-[11px]">{review.country}</span>
        </div>
      </div>
    </div>
  );
}

/** Infinite-scroll marquee row */
function MarqueeRow({ reviews, reverse = false }: { reviews: Review[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf: number;
    let x = reverse ? -el.scrollWidth / 2 : 0;
    const speed = reverse ? -0.4 : 0.4;

    function tick() {
      x += speed;
      if (!reverse && x >= el!.scrollWidth / 2) x = 0;
      if (reverse && x <= -el!.scrollWidth / 2) x = 0;
      el!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  // Duplicate cards for seamless loop
  const doubled = [...reviews, ...reviews];

  return (
    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
      <div ref={trackRef} className="flex gap-5 will-change-transform w-max">
        {doubled.map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}

interface TestimonialsSectionProps {
  /** Show the full marquee (for Home page) or a compact grid (for About page) */
  variant?: "marquee" | "grid";
}

export function TestimonialsSection({ variant = "marquee" }: TestimonialsSectionProps) {
  const row1 = allReviews.slice(0, 5);
  const row2 = allReviews.slice(5, 10);

  if (variant === "grid") {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allReviews.slice(0, 6).map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
          >
            <ReviewCard review={r} compact />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <section className="py-24 bg-card border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Verified Reviews</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3">
              Trusted by Thousands<br />Across East Africa.
            </h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-2xl font-display font-bold text-foreground">4.9 / 5</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Rating</p>
            </div>
            <div className="w-px h-14 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">10,000+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Happy Travelers</p>
            </div>
            <div className="w-px h-14 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Countries</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dual marquee rows */}
      <div className="space-y-5">
        <MarqueeRow reviews={row1} />
        <MarqueeRow reviews={row2} reverse />
      </div>
    </section>
  );
}
