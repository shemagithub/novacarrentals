import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Clock, ArrowRight, MapPin } from "lucide-react";
import { guides, guideCategories } from "@/lib/guides-data";

const categoryColors: Record<string, string> = {
  "Wildlife Safari": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "Game Drive": "bg-amber-900/50 text-amber-300 border-amber-700",
  "City Guide": "bg-blue-900/50 text-blue-300 border-blue-700",
  "City & Nature": "bg-sky-900/50 text-sky-300 border-sky-700",
  "Road Trip": "bg-cyan-900/50 text-cyan-300 border-cyan-700",
};

const coverColors: Record<string, string> = {
  "gorilla-trekking-uganda": "from-emerald-950 to-emerald-800",
  "serengeti-safari-routes": "from-amber-950 to-amber-800",
  "kigali-city-guide": "from-blue-950 to-blue-800",
  "volcanoes-national-park": "from-green-950 to-teal-800",
  "kampala-to-lake-victoria": "from-sky-950 to-sky-800",
  "zanzibar-road-trip": "from-cyan-950 to-cyan-800",
};

export default function Guides() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", ...guideCategories];

  const filtered =
    activeCategory === "All"
      ? guides
      : guides.filter((g) => g.category === activeCategory);

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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">
              Travel Guides
            </span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              Know Before You Go.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Expert guides to East Africa's greatest journeys — gorilla treks, safari routes, city explorations, and coastal road trips. Written from the road, for the road.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-20 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guide grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((guide, i) => (
              <motion.div
                key={guide.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={`/guides/${guide.slug}`}>
                  <div className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden">
                    {/* Cover */}
                    <div
                      className={`h-48 bg-gradient-to-br ${
                        coverColors[guide.slug] ?? "from-card to-card/50"
                      } relative flex items-end p-6 overflow-hidden`}
                    >
                      {/* Decorative circles */}
                      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/3" />

                      <div className="relative z-10 flex items-center gap-3">
                        <span className="text-4xl">{guide.flag}</span>
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              categoryColors[guide.category] ?? "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {guide.category}
                          </span>
                        </div>
                      </div>

                      {/* Arrow on hover */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-white/60" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {guide.country}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {guide.readTime}
                        </span>
                      </div>

                      <h2 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                        {guide.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                        {guide.subtitle}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {guide.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                        {guide.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-muted-foreground text-[10px]">
                            +{guide.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best time</p>
                          <p className="text-xs font-semibold text-foreground">{guide.bestMonths}</p>
                        </div>
                        <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read Guide <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Ready to Go?</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-4">Your Vehicle Is Waiting.</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Every guide is backed by a fleet of vehicles perfectly suited to the journey. Browse, pick, and book in minutes.
            </p>
            <Link href="/fleet">
              <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 font-display font-bold uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors">
                Browse the Fleet <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
