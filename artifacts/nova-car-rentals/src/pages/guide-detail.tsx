import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  Clock, MapPin, ArrowLeft, ArrowRight, Lightbulb,
  Calendar, Activity, ChevronRight, Car,
} from "lucide-react";
import { getGuideBySlug, guides } from "@/lib/guides-data";
import { getVehicleById } from "@/lib/fleet-data";

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Guide Not Found</h1>
          <Link href="/guides">
            <button className="text-primary underline text-sm">← Back to Travel Guides</button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedGuides = guides
    .filter((g) => g.slug !== guide.slug && g.country === guide.country)
    .slice(0, 2);

  const otherGuides = guides
    .filter((g) => g.slug !== guide.slug && g.country !== guide.country)
    .slice(0, 2);

  const suggestedRelated = [...relatedGuides, ...otherGuides].slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${guide.coverGradient} py-24`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/60 mb-8 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/guides" className="hover:text-white transition-colors">Travel Guides</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90 truncate max-w-[200px]">{guide.title}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-3xl">{guide.flag}</span>
              <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                {guide.category}
              </span>
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin className="w-3 h-3" />{guide.country}
              </span>
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Clock className="w-3 h-3" />{guide.readTime}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 leading-tight">
              {guide.title}
            </h1>
            <p className="text-white/75 text-lg leading-relaxed">{guide.subtitle}</p>
          </motion.div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mt-8">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick facts bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap divide-x divide-border">
            <div className="flex items-center gap-3 px-6 py-4">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Months</p>
                <p className="text-sm font-semibold text-foreground">{guide.bestMonths}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <Activity className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</p>
                <p className="text-sm font-semibold text-foreground">{guide.difficulty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Country</p>
                <p className="text-sm font-semibold text-foreground">{guide.country} {guide.flag}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <Car className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vehicles</p>
                <p className="text-sm font-semibold text-foreground">{guide.recommendedVehicles.length} Recommended</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Article */}
          <div className="lg:col-span-2 space-y-10">
            {/* Intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-lg text-foreground leading-relaxed border-l-4 border-primary pl-6">
                {guide.intro}
              </p>
            </motion.div>

            {/* Sections */}
            {guide.sections.map((section, i) => (
              <motion.div
                key={section.heading}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                  <span className="text-primary font-mono text-sm w-6 shrink-0 opacity-60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{section.body}</p>

                {section.tip && (
                  <div className="flex gap-4 bg-primary/8 border border-primary/25 p-5">
                    <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Local Tip</p>
                      <p className="text-sm text-foreground leading-relaxed">{section.tip}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Practical Info table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-border"
            >
              <div className="bg-card px-6 py-4 border-b border-border">
                <h3 className="font-display font-bold text-foreground uppercase tracking-wider text-sm">
                  Practical Information
                </h3>
              </div>
              <div className="divide-y divide-border">
                {guide.practicalInfo.map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-6 py-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Back link */}
            <Link href="/guides">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to All Guides
              </button>
            </Link>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommended Vehicles */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-border"
            >
              <div className="bg-primary px-5 py-4">
                <h3 className="font-display font-bold text-primary-foreground uppercase tracking-wider text-xs">
                  Recommended Vehicles
                </h3>
              </div>
              <div className="divide-y divide-border">
                {guide.recommendedVehicles.map((rec) => {
                  const vehicle = getVehicleById(rec.id);
                  return (
                    <div key={rec.id} className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-display font-bold text-sm text-foreground leading-snug">
                          {rec.name}
                        </p>
                        {vehicle?.pricing?.daily && (
                          <span className="text-xs font-bold text-primary shrink-0">
                            ${vehicle.pricing.daily}/day
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.reason}</p>
                      <Link href={`/fleet/${rec.id}`}>
                        <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                          View Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Booking CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border p-6 text-center"
            >
              <Car className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-foreground mb-2">{guide.ctaText}</h3>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Book in minutes via WhatsApp or our contact form. We confirm within 2 hours.
              </p>
              <Link href="/contact">
                <button className="w-full bg-primary text-primary-foreground px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
                  Book Now
                </button>
              </Link>
              <Link href="/fleet">
                <button className="w-full mt-2 border border-border text-muted-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-primary/50 hover:text-foreground transition-colors">
                  Browse All Vehicles
                </button>
              </Link>
            </motion.div>

            {/* Related Guides */}
            {suggestedRelated.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="border border-border"
              >
                <div className="bg-card px-5 py-4 border-b border-border">
                  <h3 className="font-display font-bold text-foreground uppercase tracking-wider text-xs">
                    More Guides
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {suggestedRelated.map((g) => (
                    <Link key={g.slug} href={`/guides/${g.slug}`}>
                      <div className="p-4 hover:bg-card/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{g.flag}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{g.country}</span>
                        </div>
                        <p className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {g.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{g.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
