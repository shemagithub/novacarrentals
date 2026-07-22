import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  Clock, MapPin, ArrowLeft, ArrowRight, Lightbulb,
  Calendar, Activity, ChevronRight, Car, BookOpen,
} from "lucide-react";
import {
  GUIDES_QUERY_KEY,
  fetchPublicTravelGuideBySlug,
  fetchPublicTravelGuides,
  guideListExcerpt,
  guideSeoDescription,
  isGuideHtml,
  type DisplayGuide,
} from "@/lib/guides-api";
import { FLEET_QUERY_KEY, fetchPublicVehicles, mapVehicleToDisplay } from "@/lib/fleet-api";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { truncateDescription } from "@/lib/seo";
import { articleJsonLd } from "@/lib/json-ld";
import { absoluteAssetUrl, getMarketingSiteOrigin } from "@/lib/site-url";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Button } from "@/components/ui/button";

function RichBlock({ content, className }: { content: string; className?: string }) {
  if (isGuideHtml(content)) {
    return (
      <div
        className={`prose prose-invert max-w-none ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <p className={className}>{content}</p>;
}

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { branding, currency } = useSiteSettings();
  const { formatRatePerDay } = useFormatMoney();

  const {
    data: apiGuide,
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useQuery({
    queryKey: [...GUIDES_QUERY_KEY, "detail", slug],
    queryFn: () => fetchPublicTravelGuideBySlug(slug || ""),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const { data: allApiGuides = [] } = useQuery({
    queryKey: GUIDES_QUERY_KEY,
    queryFn: () => fetchPublicTravelGuides(50),
    staleTime: 60_000,
  });

  const { data: fleetRaw = [] } = useQuery({
    queryKey: FLEET_QUERY_KEY,
    queryFn: () => fetchPublicVehicles(100),
    staleTime: 60_000,
  });

  const fleet = useMemo(() => fleetRaw.map((v) => mapVehicleToDisplay(v, currency)), [fleetRaw, currency]);

  const guide: DisplayGuide | null = useMemo(() => {
    if (apiGuide) return apiGuide;
    if (isFetched && !isError) return null;
    return null;
  }, [apiGuide, isFetched, isError]);

  const allGuides: DisplayGuide[] = useMemo(() => {
    if (allApiGuides.length) return allApiGuides;
    if (apiGuide) return [apiGuide];
    return [];
  }, [allApiGuides, apiGuide]);

  useDynamicPageSeo(
    guide
      ? {
          title: guide.seoTitle?.trim() || guide.title,
          description: truncateDescription(guideSeoDescription(guide)),
          image: guide.coverImageUrl || guide.cardImageUrl || undefined,
          jsonLd: articleJsonLd({
            title: guide.seoTitle?.trim() || guide.title,
            description: truncateDescription(guideSeoDescription(guide)),
            image: (guide.coverImageUrl || guide.cardImageUrl)
              ? absoluteAssetUrl(getMarketingSiteOrigin(branding), guide.coverImageUrl || guide.cardImageUrl)
              : null,
            origin: getMarketingSiteOrigin(branding),
            path: `/guides/${guide.slug}`,
          }),
        }
      : null,
  );

  if (isLoading && !guide) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-72 bg-card animate-pulse" />
        <div className="max-w-screen-2xl mx-auto px-4 py-16 space-y-8">
          <div className="h-8 w-2/3 bg-muted animate-pulse" />
          <div className="h-32 bg-muted animate-pulse" />
          <div className="h-48 bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError && !guide) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Could not load guide</h1>
          <p className="text-muted-foreground text-sm mb-6">
            The travel guide API is unreachable. Check your backend connection and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
            <Link href="/guides">
              <Button variant="ghost">Back to guides</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Guide Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This guide may be unpublished or the URL is incorrect.
          </p>
          <Link href="/guides">
            <button className="text-primary underline text-sm">← Back to Travel Guides</button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedGuides = allGuides
    .filter((g) => g.slug !== guide.slug && g.country === guide.country)
    .slice(0, 2);
  const otherGuides = allGuides
    .filter((g) => g.slug !== guide.slug && g.country !== guide.country)
    .slice(0, 2);
  const suggestedRelated = [...relatedGuides, ...otherGuides].slice(0, 3);

  const coverImage = guide.coverImageUrl || null;
  const galleryUrls = guide.galleryImageUrls?.length ? guide.galleryImageUrls : [];

  return (
    <div className="min-h-screen bg-background">
      <section className={`relative bg-gradient-to-br ${guide.coverGradient} py-24 overflow-hidden`}>
        {coverImage ? (
          <>
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        ) : (
          <div className="absolute inset-0 bg-black/30" />
        )}
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {guide.subtitle.trim() ? (
              <p className="text-white/75 text-lg leading-relaxed">{guide.subtitle}</p>
            ) : null}
          </motion.div>

          <div className="flex flex-wrap gap-2 mt-8 relative">
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

      <div className="bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[
              { icon: Calendar, label: "Best Months", value: guide.bestMonths },
              { icon: Activity, label: "Difficulty", value: guide.difficulty },
              { icon: MapPin, label: "Country", value: `${guide.country} ${guide.flag}` },
              {
                icon: Car,
                label: "Vehicles",
                value: `${guide.recommendedVehicles.length} Recommended`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-5 bg-card">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {guide.intro.trim() ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <RichBlock
                  content={guide.intro}
                  className="text-lg text-foreground leading-relaxed border-l-4 border-primary pl-6"
                />
              </motion.div>
            ) : null}

            {galleryUrls.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
              >
                {galleryUrls.map((url) => (
                  <div key={url} className="aspect-[4/3] overflow-hidden border border-border bg-card">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </motion.div>
            ) : null}

            {guide.sections.map((section, i) => {
              const imageFirst = i % 2 === 0;
              return (
                <motion.div
                  key={`${section.heading}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-5"
                >
                  <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                    <span className="text-primary font-mono text-sm w-6 shrink-0 opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </h2>

                  {section.imageUrl ? (
                    <div
                      className={`grid lg:grid-cols-2 gap-6 items-start ${
                        imageFirst ? "" : "lg:[direction:rtl]"
                      }`}
                    >
                      <div className="overflow-hidden border border-border aspect-video lg:[direction:ltr]">
                        <img src={section.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="lg:[direction:ltr] space-y-4">
                        <RichBlock content={section.body} className="text-muted-foreground leading-relaxed text-[15px]" />
                        {section.tip ? (
                          <div className="flex gap-4 bg-primary/8 border border-primary/25 p-5">
                            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Local Tip</p>
                              <RichBlock content={section.tip} className="text-sm text-foreground leading-relaxed" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
                      <RichBlock content={section.body} className="text-muted-foreground leading-relaxed text-[15px]" />
                      {section.tip ? (
                        <div className="flex gap-4 bg-primary/8 border border-primary/25 p-5">
                          <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Local Tip</p>
                            <RichBlock content={section.tip} className="text-sm text-foreground leading-relaxed" />
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </motion.div>
              );
            })}

            {guide.practicalInfo.length > 0 ? (
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
                <div className="grid sm:grid-cols-2 gap-px bg-border">
                  {guide.practicalInfo.map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1 px-6 py-4 text-sm bg-card">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}

            <Link href="/guides">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to All Guides
              </button>
            </Link>
          </div>

          <div className="space-y-6">
            {guide.recommendedVehicles.length > 0 ? (
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
                    const vehicle = fleet.find((v) => v.id === rec.id);
                    const displayName = vehicle?.name || rec.name;
                    const rate =
                      vehicle?.pricePerDay ??
                      (rec.dailyRate != null && rec.dailyRate > 0 ? rec.dailyRate : null);
                    return (
                      <div key={`${rec.id}-${rec.name}`} className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-display font-bold text-sm text-foreground leading-snug">{displayName}</p>
                          {rate != null ? (
                            <span className="text-xs font-bold text-primary shrink-0">
                              {formatRatePerDay(rate)}
                            </span>
                          ) : null}
                        </div>
                        {vehicle?.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt=""
                            className="w-full h-28 object-cover border border-border mb-3"
                            loading="lazy"
                          />
                        ) : null}
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.reason}</p>
                        {rec.id ? (
                          <Link href={`/fleet/${rec.id}`}>
                            <button className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                              View Details <ArrowRight className="w-3 h-3" />
                            </button>
                          </Link>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}

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

            {suggestedRelated.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="border border-border"
              >
                <div className="bg-card px-5 py-4 border-b border-border">
                  <h3 className="font-display font-bold text-foreground uppercase tracking-wider text-xs">More Guides</h3>
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
                        {guideListExcerpt(g, 80) ? (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{guideListExcerpt(g, 80)}</p>
                        ) : null}
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{g.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
