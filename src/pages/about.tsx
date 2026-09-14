import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, Heart, Globe, Zap, CheckCircle2, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialsSection } from "@/components/Testimonials";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { fetchPublicCmsPage, type PublicCmsPage } from "@/lib/api";
import { useCmsPageSeo } from "@/hooks/useCmsPageSeo";

const VALUE_ICONS: LucideIcon[] = [Shield, Heart, Globe, Zap];

function cmsStats(cms: PublicCmsPage | null | undefined) {
  if (cms?.published && cms.stats?.length) {
    return cms.stats.filter((s) => s.label?.trim() && s.value?.trim());
  }
  return [];
}

function cmsValues(cms: PublicCmsPage | null | undefined) {
  if (cms?.published && cms.values?.length) {
    return cms.values.filter((v) => v.title?.trim() && v.description?.trim());
  }
  return [];
}

function cmsPromises(cms: PublicCmsPage | null | undefined) {
  if (cms?.published && cms.promises?.length) {
    return cms.promises.filter((p) => p?.trim());
  }
  return [];
}

function StoryCollageImage({
  url,
  fallback,
  className,
  fallbackClassName = "text-muted/20",
}: {
  url?: string | null;
  fallback: string;
  className: string;
  fallbackClassName?: string;
}) {
  return (
    <div className={`${className} overflow-hidden flex items-center justify-center`}>
      {url ? (
        <OptimizedImage src={url} alt="" width={800} sizes="(max-width: 768px) 100vw, 33vw" className="w-full h-full object-cover" />
      ) : (
        <span className={`text-6xl font-display font-bold ${fallbackClassName}`}>{fallback}</span>
      )}
    </div>
  );
}

export default function About() {
  const { branding } = useSiteSettings();
  useCmsPageSeo("about", {
    title: "About Us",
    description: "Learn about Nova Car Rentals and our commitment to safe, reliable travel across East Africa.",
  });
  const { data: cmsAbout, isLoading } = useQuery({
    queryKey: ["cms-about"],
    queryFn: () => fetchPublicCmsPage("about"),
  });

  const published = cmsAbout?.published;
  const heroEyebrow = (published && cmsAbout?.hero_eyebrow?.trim()) || "";
  const heroTitle = (published && cmsAbout?.title?.trim()) || "";
  const heroIntroHtml = published && cmsAbout?.content?.trim() ? cmsAbout.content : null;
  const introFallback = branding?.company?.description?.trim() || branding?.footer_description?.trim() || "";

  const stats = cmsStats(cmsAbout);
  const values = cmsValues(cmsAbout);
  const promises = cmsPromises(cmsAbout);
  const storyTitle = (published && cmsAbout?.story_title?.trim()) || "";
  const storyHtml = published && cmsAbout?.story_content?.trim() ? cmsAbout.story_content : null;
  const ctaTitle = (published && cmsAbout?.cta_title?.trim()) || "";
  const ctaDescription = (published && cmsAbout?.cta_description?.trim()) || "";
  const storyQuote = (published && cmsAbout?.story_quote?.trim()) || "";
  const storyImageRw = published ? cmsAbout?.story_image_rw_url : null;
  const storyImageUg = published ? cmsAbout?.story_image_ug_url : null;
  const storyImageTz = published ? cmsAbout?.story_image_tz_url : null;

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
        <div className="max-w-screen-2xl mx-auto px-4 py-20 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!published) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md border border-dashed border-border p-10">
          <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">About page not available</h1>
          <p className="text-muted-foreground text-sm">
            Publish the about page in the admin dashboard to show content here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            {heroEyebrow ? (
              <span className="text-primary font-bold text-sm uppercase tracking-widest">{heroEyebrow}</span>
            ) : null}
            {heroTitle ? (
              <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6 whitespace-pre-line">
                {heroTitle}
              </h1>
            ) : null}
            {heroIntroHtml ? (
              <div
                className="text-muted-foreground text-lg leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: heroIntroHtml }}
              />
            ) : introFallback ? (
              <p className="text-muted-foreground text-lg leading-relaxed">{introFallback}</p>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 ? (
      <section className="border-b border-border bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/50">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center text-center py-8 px-6"
              >
                <span className="text-4xl font-display font-bold text-foreground mb-1">{stat.value}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* Story */}
      {storyTitle || storyHtml || storyImageRw || storyImageUg || storyImageTz || storyQuote ? (
      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Story</span>
              {storyTitle ? (
                <h2 className="text-4xl font-display font-bold mt-3 mb-6">{storyTitle}</h2>
              ) : null}
              {storyHtml ? (
                <div
                  className="space-y-4 text-muted-foreground leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: storyHtml }}
                />
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <StoryCollageImage
                    url={storyImageRw}
                    fallback="RW"
                    className="aspect-[3/4] bg-card border border-border"
                  />
                  <div className="aspect-square bg-primary/10 border border-primary/20 flex items-center justify-center p-6">
                    {storyQuote ? (
                      <p className="text-center text-sm font-medium text-primary leading-snug">
                        &ldquo;{storyQuote}&rdquo;
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <StoryCollageImage
                    url={storyImageUg}
                    fallback="UG"
                    className="aspect-square bg-card border border-border"
                  />
                  <StoryCollageImage
                    url={storyImageTz}
                    fallback="TZ"
                    className="aspect-[3/4] bg-muted border border-border"
                    fallbackClassName="text-muted-foreground/20"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      ) : null}

      {/* Values */}
      {values.length > 0 ? (
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Values</span>
            <h2 className="text-4xl font-display font-bold mt-3">What We Stand For</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  data-testid={`card-value-${i}`}
                  className="bg-background border border-border p-8 group hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-card flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-display font-bold mb-3">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      ) : null}

      {/* Our Promise */}
      {promises.length > 0 ? (
      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Promise</span>
            <h2 className="text-4xl font-display font-bold mt-3 mb-8">The NOVACAR Commitment</h2>
            <ul className="space-y-4">
              {promises.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
      ) : null}

      {/* Testimonials full grid */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Verified Reviews</span>
            <h2 className="text-4xl font-display font-bold mt-3">What Our Clients Say.</h2>
          </motion.div>
          <TestimonialsSection variant="grid" />
        </div>
      </section>

      {/* CTA */}
      {ctaTitle || ctaDescription ? (
      <section className="py-20 bg-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">{ctaTitle}</h2>
            {ctaDescription ? (
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">{ctaDescription}</p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 font-display font-semibold uppercase tracking-wider border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  data-testid="button-about-book"
                >
                  Book a Vehicle
                </Button>
              </Link>
              <Link href="/fleet">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 px-10 font-display font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-about-fleet"
                >
                  View Fleet <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
