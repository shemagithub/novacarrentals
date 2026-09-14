import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Clock, ArrowRight, MapPin, BookOpen, Compass } from "lucide-react";
import {
  GUIDES_QUERY_KEY,
  fetchPublicTravelGuides,
  guideCategoriesFrom,
  guideListExcerpt,
  type DisplayGuide,
} from "@/lib/guides-api";
import { fetchPublicCmsPage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useCmsPageSeo } from "@/hooks/useCmsPageSeo";

const categoryColors: Record<string, string> = {
  "Wildlife Safari": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "Game Drive": "bg-amber-900/50 text-amber-300 border-amber-700",
  "City Guide": "bg-blue-900/50 text-blue-300 border-blue-700",
  "City & Nature": "bg-sky-900/50 text-sky-300 border-sky-700",
  "Road Trip": "bg-cyan-900/50 text-cyan-300 border-cyan-700",
};

function GuideThumb({ guide, className }: { guide: DisplayGuide; className?: string }) {
  const gradient = guide.coverGradient.includes("from-")
    ? guide.coverGradient.split(" ").slice(0, 2).join(" ")
    : "from-card to-card/50";
  const thumb = guide.cardImageUrl || guide.coverImageUrl || null;

  return (
    <div className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
      {thumb ? (
        <>
          <OptimizedImage src={thumb} alt="" width={800} sizes="(max-width: 768px) 100vw, 50vw" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/3" />
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <span className="text-3xl drop-shadow">{guide.flag}</span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
            categoryColors[guide.category] ?? "bg-background/80 text-foreground border-border"
          }`}
        >
          {guide.category}
        </span>
      </div>
    </div>
  );
}

function GuideFeaturedRow({ guide }: { guide: DisplayGuide }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className="mb-10"
    >
      <Link href={`/guides/${guide.slug}`}>
        <div className="group grid lg:grid-cols-2 gap-0 bg-card border border-border hover:border-primary/40 transition-colors overflow-hidden cursor-pointer">
          <GuideThumb guide={guide} className="min-h-[260px] lg:min-h-[380px]" />
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
              Featured Guide
            </span>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {guide.country}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {guide.readTime}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
              {guide.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-4">{guideListExcerpt(guide)}</p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {guide.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best time</p>
                <p className="text-sm font-semibold text-foreground">{guide.bestMonths}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-primary group-hover:gap-3 transition-all">
                Read Guide <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function GuideListRow({ guide, index, reverse = false }: { guide: DisplayGuide; index: number; reverse?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/guides/${guide.slug}`}>
        <div
          className={`group grid md:grid-cols-[minmax(220px,32%)_1fr] gap-0 bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden cursor-pointer ${
            reverse ? "md:[direction:rtl]" : ""
          }`}
        >
          <GuideThumb guide={guide} className="min-h-[200px] md:min-h-[220px] md:[direction:ltr]" />
          <div className="p-6 md:p-8 flex flex-col justify-center md:[direction:ltr]">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {guide.country}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {guide.readTime}
              </span>
              <span>·</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {guide.difficulty}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
              {guide.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
              {guideListExcerpt(guide)}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {guide.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border mt-auto">
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
    </motion.article>
  );
}

export default function Guides() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  useCmsPageSeo("guides", {
    title: "Travel Guides",
    description: "Expert driving guides for Kigali, Serengeti, Kampala, and beyond.",
  });

  const {
    data: apiGuides = [],
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useQuery({
    queryKey: GUIDES_QUERY_KEY,
    queryFn: () => fetchPublicTravelGuides(50),
    staleTime: 60_000,
  });

  const { data: cmsGuides } = useQuery({
    queryKey: ["cms-guides"],
    queryFn: () => fetchPublicCmsPage("guides"),
    staleTime: 60_000,
  });

  const guideList: DisplayGuide[] = useMemo(() => {
    if (!isFetched || isError) return [];
    return apiGuides;
  }, [apiGuides, isFetched, isError]);

  const categoryList = guideCategoriesFrom(guideList);
  const categories = ["All", ...categoryList];

  const filtered = useMemo(
    () => (activeCategory === "All" ? guideList : guideList.filter((g) => g.category === activeCategory)),
    [activeCategory, guideList],
  );

  const [featured, ...rest] = filtered;
  const listGuides = activeCategory === "All" ? rest : filtered;

  const heroTitle =
    cmsGuides?.published && cmsGuides.title?.trim() ? cmsGuides.title : "Travel Guides";
  const heroIntroHtml =
    cmsGuides?.published && cmsGuides.content?.trim() ? cmsGuides.content : null;
  const heroIntroFallback =
    !heroIntroHtml
      ? "Expert driving guides for East Africa — routes, permits, seasons, and vehicle recommendations from the NovaCar team."
      : null;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Travel Guides</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6 whitespace-pre-line">{heroTitle}</h1>
            {heroIntroHtml ? (
              <div
                className="text-muted-foreground text-lg leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: heroIntroHtml }}
              />
            ) : heroIntroFallback ? (
              <p className="text-muted-foreground text-lg leading-relaxed">{heroIntroFallback}</p>
            ) : null}
          </motion.div>
        </div>
      </section>

      <div className="sticky top-20 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <section className="py-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[220px] bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 border border-dashed border-border">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl mb-2">Could not load guides</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                The travel guides API is unreachable. Check that the backend is running and{" "}
                <code className="text-xs bg-muted px-1">VITE_API_PROXY_TARGET</code> is set correctly.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              {isFetched && apiGuides.length === 0
                ? "No published travel guides yet. Add and publish guides in the admin dashboard."
                : "No guides in this category yet."}
            </p>
          ) : (
            <>
              {featured && activeCategory === "All" ? <GuideFeaturedRow guide={featured} /> : null}
              <div className="space-y-5">
                {listGuides.map((guide, i) => (
                  <GuideListRow key={guide.slug} guide={guide} index={i} reverse={i % 2 === 1} />
                ))}
              </div>
              {filtered.length > 0 ? (
                <p className="text-center text-xs text-muted-foreground mt-10 flex items-center justify-center gap-2">
                  <Compass className="w-3.5 h-3.5" />
                  {filtered.length} guide{filtered.length === 1 ? "" : "s"}
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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
