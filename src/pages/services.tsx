import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES_QUERY_KEY, fetchPublicServicesPage, type PublicCmsPage } from "@/lib/services-api";
import { SERVICE_ICONS, type ServiceIconKey, type ServiceItem } from "@/lib/services-data";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";

function mapApiService(row: {
  icon: string;
  title: string;
  tagline: string;
  description: string;
  perks: string[];
  cta_text: string;
  display_order?: number;
}): ServiceItem {
  const iconKeys: ServiceIconKey[] = ["car", "user-check", "plane", "building", "camera", "calendar"];
  const icon = (iconKeys.includes(row.icon as ServiceIconKey) ? row.icon : "car") as ServiceIconKey;
  return {
    icon,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    perks: row.perks ?? [],
    ctaText: row.cta_text || "Book Now",
    displayOrder: row.display_order ?? 0,
  };
}

function resolvePageData(cms: PublicCmsPage | undefined, isFetched: boolean, isError: boolean) {
  if (!isFetched || isError || !cms?.published) {
    return { hero: null, services: null, perfectFor: null, bottomCta: null };
  }

  const hero = {
    eyebrow: cms.hero_eyebrow?.trim() || "",
    title: cms.title?.trim() || "",
    intro: cms.content?.trim() || "",
  };

  const services: ServiceItem[] = cms.service_items?.length
    ? [...cms.service_items.map(mapApiService)].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    : [];

  const perfectFor = {
    eyebrow: cms.perfect_for_eyebrow?.trim() || "",
    title: cms.perfect_for_title?.trim() || "",
    items: cms.perfect_for_items?.length ? cms.perfect_for_items : [],
  };

  const bottomCta = {
    title: cms.bottom_cta_title?.trim() || "",
    description: cms.bottom_cta_description?.trim() || "",
    button: cms.bottom_cta_button?.trim() || "",
  };

  return { hero, services, perfectFor, bottomCta };
}

export default function Services() {
  const { data: cms, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: fetchPublicServicesPage,
    staleTime: 60_000,
  });

  const { hero, services, perfectFor, bottomCta } = useMemo(
    () => resolvePageData(cms, isFetched, isError),
    [cms, isFetched, isError],
  );

  useDynamicPageSeo(
    cms?.published
      ? {
          title: cms.seo_title?.trim() || cms.title?.trim() || "Our Services",
          description: cms.seo_description?.trim() || hero?.intro || undefined,
        }
      : null,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-24 bg-card border-b border-border">
          <div className="max-w-screen-2xl mx-auto px-4 max-w-3xl space-y-4">
            <div className="h-4 w-32 bg-muted animate-pulse" />
            <div className="h-14 w-full max-w-lg bg-muted animate-pulse" />
            <div className="h-20 w-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-4 py-20 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md border border-dashed border-border p-10">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Could not load services</h1>
          <p className="text-muted-foreground text-sm mb-6">
            The services API is unreachable. Check that the backend is running and try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!hero || services === null || !perfectFor || !bottomCta) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md border border-dashed border-border p-10">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Services page not available</h1>
          <p className="text-muted-foreground text-sm">
            Publish the services page in the admin dashboard to show content here.
          </p>
        </div>
      </div>
    );
  }

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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">{hero.eyebrow}</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6 whitespace-pre-line">{hero.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{hero.intro}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {services.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No services published yet. Add them in the admin Services page.
            </p>
          ) : (
            <div className="space-y-4">
              {services.map((service, i) => {
                const Icon = SERVICE_ICONS[service.icon] ?? SERVICE_ICONS.car;
                return (
                  <motion.div
                    key={`${service.title}-${i}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    data-testid={`card-service-${i}`}
                    className="group bg-card border border-border hover:border-primary/40 transition-all duration-300 overflow-hidden"
                  >
                    <div className="grid md:grid-cols-[1fr_1.5fr] gap-0">
                      <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between gap-6">
                        <div>
                          <div className="w-14 h-14 bg-background flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs text-primary font-bold uppercase tracking-widest block mb-2">
                            {service.tagline}
                          </span>
                          <h2 className="text-2xl font-display font-bold mb-4">{service.title}</h2>
                          <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                        </div>
                        <Link href="/contact">
                          <Button
                            className="gap-2 font-display uppercase tracking-wider text-xs w-full md:w-auto"
                            data-testid={`button-service-${i}`}
                          >
                            {service.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                      <div className="p-8 md:p-10">
                        <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-6">
                          What&apos;s Included
                        </h3>
                        <ul className="space-y-3.5">
                          {service.perks.length > 0 ? (
                            service.perks.map((perk) => (
                              <li key={perk} className="flex items-start gap-3 text-sm text-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                {perk}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground italic">
                              Contact us for full service details and pricing.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">{perfectFor.eyebrow}</span>
            <h2 className="text-4xl font-display font-bold mt-3">{perfectFor.title}</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {perfectFor.items.map((item) => (
              <span
                key={item}
                className="px-5 py-2.5 bg-background border border-border text-sm text-foreground font-medium hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-display font-bold mb-4">{bottomCta.title}</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">{bottomCta.description}</p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 font-display font-semibold uppercase tracking-wider" data-testid="button-contact-services">
                {bottomCta.button}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
