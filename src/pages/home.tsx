import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Map,
  Clock,
  Star,
  CarFront,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialsSection } from "@/components/Testimonials";
import { OptimizedImage } from "@/components/OptimizedImage";
import { VehicleImage } from "@/components/VehicleImage";
import { NegotiablePriceBadge } from "@/components/NegotiablePriceBadge";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { fetchPublicCmsPage } from "@/lib/api";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";
import { formatPageTitle, truncateDescription } from "@/lib/seo";
import {
  FLEET_QUERY_KEY,
  fetchPublicVehicles,
  mapVehicleToDisplay,
} from "@/lib/fleet-api";
import { GUIDES_QUERY_KEY, fetchPublicTravelGuides, guideListExcerpt, type DisplayGuide } from "@/lib/guides-api";
import {
  HOME_ABOUT_QUERY_KEY,
  HOME_QUERY_KEY,
  resolveHomeContent,
  SERVICE_ICONS,
  VALUE_ICONS,
} from "@/lib/home-data";

const STAT_ICONS = [Star, CarFront, Clock, Map] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

function GuideTeaserCard({ guide }: { guide: DisplayGuide }) {
  const thumb = guide.cardImageUrl || guide.coverImageUrl;
  const gradient = guide.coverGradient.includes("from-")
    ? guide.coverGradient.split(" ").slice(0, 2).join(" ")
    : "from-card to-card/50";

  return (
    <Link href={`/guides/${guide.slug}`}>
      <div className="group bg-background border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden">
        <div className="h-36 relative overflow-hidden bg-muted">
          {thumb ? (
            <>
              <OptimizedImage src={thumb} alt="" width={640} sizes="(max-width: 768px) 100vw, 33vw" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/35" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="text-2xl">{guide.flag}</span>
            <span className="text-white/80 text-xs font-medium">{guide.country}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <BookOpen className="w-3 h-3" />
            {guide.readTime}
            <span>·</span>
            <span className="text-primary/80 font-medium">{guide.category}</span>
          </div>
          <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
            {guide.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-3">{guideListExcerpt(guide)}</p>
          <div className="mt-4 flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider group-hover:gap-2 transition-all">
            Read Guide <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FleetSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-muted" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-20 bg-muted" />
            <div className="h-5 w-full bg-muted" />
            <div className="h-3 w-24 bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Home() {
  const { t } = useLang();
  const { branding, siteName, globalSeo, currency } = useSiteSettings();

  const { data: cmsHome } = useQuery({
    queryKey: HOME_QUERY_KEY,
    queryFn: () => fetchPublicCmsPage("home"),
    staleTime: 60_000,
  });

  const { data: cmsAbout } = useQuery({
    queryKey: HOME_ABOUT_QUERY_KEY,
    queryFn: () => fetchPublicCmsPage("about"),
    staleTime: 60_000,
  });

  const { data: cmsServices } = useQuery({
    queryKey: ["cms-service-home"],
    queryFn: () => fetchPublicCmsPage("service"),
    staleTime: 60_000,
  });

  const { data: cmsDestinations } = useQuery({
    queryKey: ["cms-destinations-home"],
    queryFn: () => fetchPublicCmsPage("destinations"),
    staleTime: 60_000,
  });

  const { data: cmsGuides } = useQuery({
    queryKey: ["cms-guides-home"],
    queryFn: () => fetchPublicCmsPage("guides"),
    staleTime: 60_000,
  });

  const { data: fleetRaw = [], isLoading: fleetLoading } = useQuery({
    queryKey: FLEET_QUERY_KEY,
    queryFn: () => fetchPublicVehicles(100),
    staleTime: 60_000,
  });

  const { data: apiGuides = [], isFetched: guidesFetched } = useQuery({
    queryKey: GUIDES_QUERY_KEY,
    queryFn: () => fetchPublicTravelGuides(6),
    staleTime: 60_000,
  });

  const content = useMemo(
    () =>
      resolveHomeContent({
        branding,
        siteName,
        cmsHome,
        cmsAbout,
        cmsServices,
        cmsDestinations,
        cmsGuides,
        fleetCount: fleetRaw.length,
        t,
      }),
    [branding, siteName, cmsHome, cmsAbout, cmsServices, cmsDestinations, cmsGuides, fleetRaw.length, t],
  );

  const fleetTeaser = useMemo(() => {
    return fleetRaw.slice(0, 4).map((v) => {
      const m = mapVehicleToDisplay(v, currency);
      return {
        id: m.id,
        name: m.name,
        type: m.category || m.type,
        category: m.category || m.type,
        badge: m.badge || "",
        imageUrl: m.imageUrl,
      };
    });
  }, [fleetRaw, currency]);

  const guideTeaser: DisplayGuide[] = useMemo(() => {
    if (!guidesFetched) return [];
    return apiGuides.slice(0, 3);
  }, [apiGuides, guidesFetched]);

  useDynamicPageSeo(
    cmsHome?.published
      ? {
          title: formatPageTitle(
            cmsHome.seo_title?.trim() || cmsHome.title?.trim() || siteName,
            siteName,
          ),
          description: truncateDescription(
            cmsHome.seo_description?.trim() || content.hero.sub || globalSeo.description,
          ),
        }
      : null,
  );

  const { hero, stats, services, why, destinations, guides, promise } = content;
  const destHeadlineParts = destinations.headline.split("\n");

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─── */}
      <section className="relative h-screen min-h-[640px] flex items-center">
        <div className="absolute inset-0 z-0">
          {hero.imageUrl ? (
            <OptimizedImage src={hero.imageUrl} alt={hero.imageAlt} width={1600} sizes="100vw" priority className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card via-background to-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.05] mb-6">
              {hero.headline}{" "}
              {hero.headlineAccent ? (
                <span className="text-primary italic block md:inline">{hero.headlineAccent}</span>
              ) : null}
            </h1>
            {hero.subHtml ? (
              <div
                className="text-lg md:text-xl text-foreground/75 mb-10 leading-relaxed font-light max-w-xl prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: hero.subHtml }}
              />
            ) : (
              <p className="text-lg md:text-xl text-foreground/75 mb-10 leading-relaxed font-light max-w-xl">
                {hero.sub}
              </p>
            )}
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
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/40">
            {stats.map((stat, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              return (
                <motion.div
                  key={stat.label}
                  {...fadeUp(i * 0.08)}
                  className="flex flex-col items-center justify-center text-center py-6 px-4"
                  data-testid={`stat-${i}`}
                >
                  <Icon className="w-5 h-5 text-primary mb-3 opacity-80" />
                  <span className="text-3xl font-display font-bold text-foreground mb-0.5">{stat.value}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    {stat.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">{services.eyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3">{services.headline}</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {services.items.map((s, i) => {
              const Icon = SERVICE_ICONS[s.icon] ?? Shield;
              return (
                <motion.div
                  key={`${s.title}-${i}`}
                  {...fadeUp(i * 0.06)}
                  data-testid={`service-tile-${i}`}
                  className="bg-background p-8 group hover:bg-card transition-colors relative"
                >
                  <div className="absolute top-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500" />
                  <div className="w-10 h-10 bg-card border border-border flex items-center justify-center mb-4 text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{s.tagline}</p>
                  <h3 className="text-lg font-display font-bold mb-3 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">{s.description}</p>
                  <Link
                    href="/services"
                    className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary gap-1.5 hover:gap-3 transition-all"
                  >
                    {s.ctaText || "Learn More"} <ArrowRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHY NOVACAR ─── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
            <motion.div {...fadeUp()}>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">{why.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-6 leading-tight">{why.headline}</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{why.sub}</p>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="gap-2 font-display uppercase tracking-wider text-xs h-11"
                  data-testid="button-about"
                >
                  {t("why_story")} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {why.values.map((item, i) => {
                const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                return (
                  <motion.div
                    key={item.title}
                    {...fadeUp(i * 0.07)}
                    data-testid={`why-card-${i}`}
                    className="bg-background border border-border p-6 group hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-card flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-bold text-sm mb-2">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <TestimonialsSection variant="marquee" />

      {/* ─── FLEET TEASER ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {fleetLoading ? (
              <FleetSkeleton />
            ) : fleetTeaser.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-border text-muted-foreground text-sm">
                Fleet listings will appear here once vehicles are published in admin.
              </div>
            ) : (
              fleetTeaser.map((car, i) => (
                <motion.div
                  key={car.id || i}
                  {...fadeUp(i * 0.08)}
                  data-testid={`fleet-card-${i}`}
                  className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <VehicleImage
                      src={car.imageUrl}
                      category={car.category}
                      name={car.name}
                      width={640}
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <NegotiablePriceBadge />
                    {car.badge && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                        {car.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{car.type}</p>
                    <h3 className="font-display font-bold text-base mb-4">{car.name}</h3>
                    <Link
                      href={car.id ? `/fleet/${car.id}` : "/fleet"}
                      className="flex items-center text-xs font-bold uppercase tracking-wider gap-1.5 group-hover:text-primary transition-colors hover:gap-2.5"
                    >
                      {t("fleet_reserve")} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS TEASER ─── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()} className="space-y-7">
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">{destinations.eyebrow}</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 leading-tight">
                  {destHeadlineParts[0]}
                  {destHeadlineParts[1] ? (
                    <>
                      .<br />
                      {destHeadlineParts.slice(1).join(". ")}
                    </>
                  ) : null}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">{destinations.sub}</p>
              <ul className="space-y-3.5">
                {destinations.bullets.map((text) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {text}
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
              {destinations.imageUrl ? (
                <OptimizedImage
                  src={destinations.imageUrl}
                  alt={destinations.eyebrow}
                  width={1280}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 border border-border"
                />
              ) : (
                <div className="absolute inset-0 bg-muted border border-border" />
              )}
              <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur border border-border p-4 max-w-[220px]">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{destinations.crossBorderTitle}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{destinations.crossBorderDescription}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TRAVEL GUIDES TEASER ─── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">{guides.eyebrow}</span>
              <h2 className="text-4xl font-display font-bold mt-3 whitespace-pre-line">{guides.headline}</h2>
              {guides.subHtml ? (
                <div
                  className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: guides.subHtml }}
                />
              ) : (
                <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed">{guides.sub}</p>
              )}
            </div>
            <Link href="/guides">
              <Button variant="outline" className="gap-2 font-display uppercase tracking-wide text-xs shrink-0">
                All Guides <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {!guidesFetched && guideTeaser.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading guides…
            </div>
          ) : guideTeaser.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border text-muted-foreground text-sm">
              Travel guides will appear here once published in admin.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {guideTeaser.map((guide, i) => (
                <motion.div key={guide.slug} {...fadeUp(i * 0.08)}>
                  <GuideTeaserCard guide={guide} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── PROMISE STRIP ─── */}
      <section className="py-20 bg-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
                {promise.headline}
              </h2>
              <p className="text-primary-foreground/70 text-lg">{promise.sub}</p>
            </div>
            <div className="flex gap-4 shrink-0">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 font-display font-bold uppercase tracking-widest border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  data-testid="button-cta-book"
                >
                  {promise.bookLabel}
                </Button>
              </Link>
              <Link href="/fleet">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-13 px-8 font-display font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-cta-fleet"
                >
                  {promise.fleetLabel}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
