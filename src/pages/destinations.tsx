import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DESTINATIONS_QUERY_KEY,
  fetchPublicDestinationsPage,
  type PublicCmsPage,
} from "@/lib/destinations-api";
import {
  DESTINATION_ICONS,
  type DestinationAirport,
  type DestinationCountry,
  type DestinationIconKey,
} from "@/lib/destinations-data";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";

function mapApiCountry(row: {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  cities: string[];
  parks: { name: string; highlight: string }[];
  img_bg: string;
  cover_image_url?: string | null;
  display_order?: number;
}): DestinationCountry {
  const icon = (["mountain", "trees", "waves"].includes(row.icon) ? row.icon : "mountain") as DestinationIconKey;
  return {
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    icon,
    cities: row.cities ?? [],
    parks: row.parks ?? [],
    imgBg: row.img_bg,
    coverImageUrl: row.cover_image_url ?? null,
    displayOrder: row.display_order ?? 0,
  };
}

function resolvePageData(cms: PublicCmsPage | undefined, isFetched: boolean, isError: boolean) {
  if (!isFetched || isError || !cms?.published) {
    return { hero: null, countries: null, airportsSection: null, airports: null, crossBorder: null };
  }

  const hero = {
    eyebrow: cms.hero_eyebrow?.trim() || "",
    title: cms.title?.trim() || "",
    intro: cms.content?.trim() || "",
  };

  const countries: DestinationCountry[] = cms.destination_countries?.length
    ? [...cms.destination_countries.map(mapApiCountry)].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      )
    : [];

  const airportsSection = {
    eyebrow: cms.airports_eyebrow?.trim() || "",
    title: cms.airports_title?.trim() || "",
    intro: cms.airports_intro?.trim() || "",
  };

  const airports: DestinationAirport[] = cms.destination_airports?.length
    ? cms.destination_airports.map((a) => ({
        city: a.city,
        country: a.country,
        code: a.code,
        airport: a.airport,
      }))
    : [];

  const crossBorder = {
    eyebrow: cms.cross_border_eyebrow?.trim() || "",
    title: cms.cross_border_title?.trim() || "",
    description: cms.cross_border_description?.trim() || "",
    button: cms.cross_border_button?.trim() || "",
  };

  return { hero, countries, airportsSection, airports, crossBorder };
}

export default function Destinations() {
  const { data: cms, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: DESTINATIONS_QUERY_KEY,
    queryFn: fetchPublicDestinationsPage,
    staleTime: 60_000,
  });

  const { hero, countries, airportsSection, airports, crossBorder } = useMemo(
    () => resolvePageData(cms, isFetched, isError),
    [cms, isFetched, isError],
  );

  useDynamicPageSeo(
    cms?.published
      ? {
          title: cms.seo_title?.trim() || cms.title?.trim() || "Destinations",
          description: cms.seo_description?.trim() || hero?.intro || undefined,
        }
      : null,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-24 bg-card border-b border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl space-y-4">
            <div className="h-4 w-32 bg-muted animate-pulse" />
            <div className="h-14 w-full max-w-lg bg-muted animate-pulse" />
            <div className="h-20 w-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-4 py-20 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[340px] bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md border border-dashed border-border p-10">
          <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Could not load destinations</h1>
          <p className="text-muted-foreground text-sm mb-6">
            The destinations API is unreachable. Check that the backend is running and try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!hero || countries === null || !airportsSection || airports === null || !crossBorder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md border border-dashed border-border p-10">
          <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Destinations page not available</h1>
          <p className="text-muted-foreground text-sm">
            Publish the destinations page in the admin dashboard to show content here.
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {countries.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No destination countries published yet. Add them in the admin Destinations page.
            </p>
          ) : (
            countries.map((country, ci) => {
              const Icon = DESTINATION_ICONS[country.icon] ?? DESTINATION_ICONS.mountain;
              return (
                <motion.div
                  key={`${country.name}-${ci}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.1 }}
                  data-testid={`card-country-${ci}`}
                  className="bg-card border border-border overflow-hidden"
                >
                  <div className="grid lg:grid-cols-[1fr_1.4fr] gap-0">
                    <div
                      className={`${country.coverImageUrl ? "" : country.imgBg} p-10 flex flex-col justify-between gap-8 min-h-[340px] border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden`}
                    >
                      {country.coverImageUrl ? (
                        <>
                          <img
                            src={country.coverImageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/50" />
                        </>
                      ) : null}
                      <div className={country.coverImageUrl ? "relative z-10" : ""}>
                        <Icon className="w-8 h-8 text-primary mb-4" />
                        <h2 className="text-4xl font-display font-bold mb-2">{country.name}</h2>
                        <p className="text-primary font-semibold text-sm mb-6">{country.tagline}</p>
                        <p className="text-muted-foreground leading-relaxed text-sm">{country.description}</p>
                      </div>
                      <Link href="/contact" className={country.coverImageUrl ? "relative z-10" : ""}>
                        <Button
                          className="gap-2 font-display uppercase tracking-wider text-xs w-full sm:w-auto"
                          data-testid={`button-book-${country.name.toLowerCase()}`}
                        >
                          Book in {country.name} <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>

                    <div className="p-10 grid sm:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
                          Cities We Serve
                        </h3>
                        <ul className="space-y-2.5">
                          {country.cities.map((city) => (
                            <li key={city} className="flex items-center gap-2.5 text-sm text-foreground">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              {city}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
                          Parks &amp; Natural Wonders
                        </h3>
                        <ul className="space-y-3.5">
                          {country.parks.map((park) => (
                            <li key={park.name} className="text-sm">
                              <span className="text-foreground font-medium block">{park.name}</span>
                              <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                                {park.highlight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">{airportsSection.eyebrow}</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-4">{airportsSection.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{airportsSection.intro}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {airports.map((ap, i) => (
              <motion.div
                key={`${ap.code}-${i}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                data-testid={`card-airport-${i}`}
                className="bg-background border border-border p-5 flex items-start gap-4 group hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-card flex items-center justify-center shrink-0 font-display font-bold text-primary text-sm border border-border">
                  {ap.code}
                </div>
                <div>
                  <p className="font-display font-bold text-base">{ap.city}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ap.airport}</p>
                  <span className="text-xs text-primary font-semibold uppercase tracking-wider">{ap.country}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-primary font-bold text-sm uppercase tracking-widest">{crossBorder.eyebrow}</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-4">{crossBorder.title}</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">{crossBorder.description}</p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 font-display font-semibold uppercase tracking-wider" data-testid="button-crossborder">
                {crossBorder.button}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
