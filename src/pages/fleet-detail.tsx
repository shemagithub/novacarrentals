import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, ArrowRight, Users, Briefcase, Fuel, Zap,
  CheckCircle2, Phone, Shield,
  Gauge, Car, Star, Clock, CarFront, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { NegotiablePriceBadge } from "@/components/NegotiablePriceBadge";
import {
  FLEET_QUERY_KEY,
  fetchPublicVehicleById,
  fetchPublicVehicles,
  fleetVehicleQueryKey,
  mapVehicleToDisplay,
} from "@/lib/fleet-api";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { vehicleProductJsonLd } from "@/lib/json-ld";
import { absoluteAssetUrl, getMarketingSiteOrigin } from "@/lib/site-url";
import { formatPageTitle, truncateDescription } from "@/lib/seo";
import {
  buildWhatsAppChatUrl,
  formatVehicleEnquiryMessage,
  getWhatsAppBaseUrl,
} from "@/lib/whatsapp";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

const CATEGORY_COLORS: Record<string, string> = {
  "Safari & 4x4": "text-amber-400",
  "Executive & Luxury": "text-blue-400",
  "Economy & Compact": "text-emerald-400",
  "Vans & Groups": "text-purple-400",
};

export default function FleetDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const { siteName, globalSeo, branding, currency } = useSiteSettings();

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: fleetVehicleQueryKey(id ?? ""),
    queryFn: () => fetchPublicVehicleById(id ?? ""),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const { data: allRaw = [] } = useQuery({
    queryKey: FLEET_QUERY_KEY,
    queryFn: () => fetchPublicVehicles(100),
    staleTime: 60_000,
  });

  const vehicle = raw ? mapVehicleToDisplay(raw, currency) : null;

  const related = useMemo(() => {
    if (!vehicle) return [];
    return allRaw
      .filter((v) => String(v.id) !== vehicle.id && v.category === vehicle.category)
      .slice(0, 3)
      .map((v) => mapVehicleToDisplay(v, currency));
  }, [allRaw, vehicle, currency]);

  const pageSeo = useMemo(() => {
    if (!vehicle) return null;
    const origin = getMarketingSiteOrigin(branding);
    return {
      title: formatPageTitle(`Rent ${vehicle.name}`, siteName || globalSeo.title),
      description: truncateDescription(vehicle.description),
      image: vehicle.imageUrl || globalSeo.og_image_url,
      jsonLd: vehicleProductJsonLd({
        name: vehicle.name,
        description: vehicle.description,
        image: vehicle.imageUrl ? absoluteAssetUrl(origin, vehicle.imageUrl) : null,
        category: vehicle.category,
        origin,
        path: `/fleet/${vehicle.id}`,
      }),
    };
  }, [vehicle, siteName, globalSeo, branding]);

  useDynamicPageSeo(pageSeo);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <p className="text-6xl">🚗</p>
          <h1 className="text-3xl font-display font-bold">Vehicle Not Found</h1>
          <p className="text-muted-foreground">We couldn't find a vehicle with that ID.</p>
          <Link href="/fleet">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Fleet
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[vehicle.category] ?? "text-primary";
  const heroImage = vehicle.galleryImages[0] ?? vehicle.imageUrl;
  const waEnquiryUrl = buildWhatsAppChatUrl(
    getWhatsAppBaseUrl(branding),
    formatVehicleEnquiryMessage(vehicle.name, vehicle.type, siteName || "NOVACAR"),
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── BREADCRUMB ── */}
      <div className="border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/fleet" className="hover:text-primary transition-colors">Fleet</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{vehicle.name}</span>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="py-16 bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/fleet" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Fleet
          </Link>

          <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
            {/* Vehicle image placeholder */}
            <motion.div {...fadeUp()} className="relative">
              <div className="aspect-[16/9] bg-gradient-to-br from-muted via-muted to-background/60 border border-border flex items-center justify-center relative overflow-hidden">
                {heroImage ? (
                  <OptimizedImage
                    src={heroImage}
                    alt={vehicle.name}
                    width={1280}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-5"
                      style={{
                        backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                      }}
                    />
                    <CarFront className="w-24 h-24 text-muted-foreground/20" />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />

                {/* Price badge */}
                <NegotiablePriceBadge variant="hero" />

                {/* Badge */}
                {vehicle.badge && (
                  <div className="absolute top-5 left-5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 uppercase tracking-widest">
                    {vehicle.badge}
                  </div>
                )}

                {/* Tags */}
                <div className="absolute top-5 right-5 flex flex-wrap gap-2 justify-end">
                  {vehicle.tags.filter((t) => t !== vehicle.badge).map((tag) => (
                    <span key={tag} className="bg-background/80 backdrop-blur border border-border text-xs font-semibold px-2.5 py-1 text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {vehicle.galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {vehicle.galleryImages.slice(0, 4).map((url) => (
                    <div key={url} className="aspect-[4/3] bg-muted border border-border overflow-hidden">
                      <OptimizedImage src={url} alt="" width={400} sizes="25vw" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick stats bar */}
              <div className="grid grid-cols-4 border-l border-r border-b border-border bg-card">
                {[
                  { icon: Users, label: "Seats", value: `${vehicle.seats}` },
                  { icon: Briefcase, label: "Bags", value: `${vehicle.bags}` },
                  { icon: Fuel, label: "Fuel", value: vehicle.fuel },
                  { icon: Zap, label: "Trans.", value: vehicle.transmission.split(" ")[0] },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center justify-center py-4 px-3 border-r last:border-r-0 border-border text-center">
                    <Icon className="w-4 h-4 text-primary mb-1.5 opacity-80" />
                    <p className="text-sm font-display font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Info + CTA panel */}
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest ${catColor}`}>
                  {vehicle.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-display font-bold mt-2 mb-1 leading-tight">
                  {vehicle.name}
                </h1>
                <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">
                  {vehicle.type}
                </p>
              </div>

              <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                {vehicle.description}
              </p>

              {/* Pricing */}
              <div className="border border-border">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground">{t("fleet_price_label")}</p>
                </div>
                <div className="px-4 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-bold text-foreground">{t("fleet_negotiable")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("fleet_quote_hint")}</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <Link href="/contact">
                  <Button className="w-full h-12 font-display uppercase tracking-widest text-sm shadow-lg shadow-primary/25">
                    Book This Vehicle <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a
                  href={waEnquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#20bf5b] text-white text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Enquire on WhatsApp
                </a>
                <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  No payment required · Confirmation in 2 hours
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS ── */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12"
          >
            {/* Key Highlights */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-display font-bold">Key Highlights</h2>
              </div>
              <ul className="space-y-4">
                {vehicle.highlights.map((h, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground leading-relaxed">{h}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Ideal For */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Car className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-display font-bold">Ideal For</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.idealFor.map((use, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="px-3 py-2 bg-card border border-border text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
                  >
                    {use}
                  </motion.span>
                ))}
              </div>

              {/* Driver add-on callout */}
              <div className="mt-8 border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Add a Professional Driver</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All vehicles can be hired with a professional, multilingual driver — rate is negotiable. English, French, Kinyarwanda, and Swahili speakers available.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FULL SPECS ── */}
      <section className="py-16 bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-display font-bold">Full Specifications</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {vehicle.specs.map(({ label, value }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card px-5 py-5 group hover:bg-muted/40 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">{label}</p>
                <p className="text-sm font-display font-bold text-foreground">{value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">NOVACAR Guarantee</p>
            </div>
            {[
              { icon: Clock, text: "Confirmation within 2 hours" },
              { icon: Shield, text: "Fully insured on every rental" },
              { icon: Phone, text: "24/7 emergency support" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED VEHICLES ── */}
      {related.length > 0 && (
        <section className="py-16 bg-card border-b border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-display font-bold">Similar Vehicles</h2>
              <Link href="/fleet" className="text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group bg-background border border-border hover:border-primary/50 transition-all overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-muted relative flex items-center justify-center overflow-hidden">
                    {v.imageUrl ? (
                      <OptimizedImage
                        src={v.imageUrl}
                        alt={v.name}
                        width={640}
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <CarFront className="w-12 h-12 text-muted-foreground/20" />
                    )}
                    <NegotiablePriceBadge />
                    {v.badge && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 uppercase tracking-wider">
                        {v.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{v.type}</p>
                    <h3 className="font-display font-bold text-base mb-1 group-hover:text-primary transition-colors">{v.name}</h3>
                    <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.seats}</span>
                      <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{v.fuel}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{v.transmission.split(" ")[0]}</span>
                    </div>
                    <Link href={`/fleet/${v.id}`}>
                      <Button size="sm" variant="outline" className="w-full font-display uppercase tracking-wider text-xs h-9">
                        View Details <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOKING CTA ── */}
      <section className="py-20 bg-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
              Ready to Book the {vehicle.name}?
            </h2>
            <p className="text-primary-foreground/75 text-lg max-w-xl mx-auto">
              Fill out our quick inquiry form — confirmation within 2 hours, no payment until your booking is confirmed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-10 font-display font-semibold uppercase tracking-wider text-sm border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Send Booking Inquiry
                </Button>
              </Link>
              <Link href="/fleet">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-13 px-8 font-display font-semibold uppercase tracking-wider text-sm text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Browse Fleet
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
