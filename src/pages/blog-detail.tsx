import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  Share2,
  User,
} from "lucide-react";
import { fetchPublicBlogBySlug, fetchPublicBlogs } from "@/lib/api";
import { useDynamicPageSeo } from "@/hooks/useDynamicPageSeo";
import { formatPageTitle, truncateDescription } from "@/lib/seo";
import { articleJsonLd } from "@/lib/json-ld";
import { absoluteAssetUrl, getMarketingSiteOrigin } from "@/lib/site-url";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Button } from "@/components/ui/button";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readMinutes(html: string) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { siteName, globalSeo, branding } = useSiteSettings();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["public-blog", slug],
    queryFn: () => fetchPublicBlogBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ["public-blogs"],
    queryFn: () => fetchPublicBlogs(20),
  });

  const related = useMemo(
    () => allPosts.filter((p) => p.slug !== slug).slice(0, 3),
    [allPosts, slug],
  );

  const pageSeo = useMemo(() => {
    if (!post) return null;
    const origin = getMarketingSiteOrigin(branding);
    const title = formatPageTitle(
      post.seo_title?.trim() || post.title,
      siteName || globalSeo.title,
    );
    const description = truncateDescription(
      post.seo_description?.trim() || post.excerpt || globalSeo.description,
    );
    const image = post.cover_image_url || globalSeo.og_image_url;
    return {
      title,
      description,
      image,
      jsonLd: articleJsonLd({
        title: post.seo_title?.trim() || post.title,
        description,
        image: image ? absoluteAssetUrl(origin, image) : null,
        origin,
        path: `/blogs/${post.slug}`,
        datePublished: post.created_at,
        author: post.author,
      }),
    };
  }, [post, siteName, globalSeo, branding]);

  useDynamicPageSeo(pageSeo);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-display font-bold mb-4">Post not found</h1>
          <p className="text-muted-foreground mb-8">
            This article may have been removed or is not published yet.
          </p>
          <Link href="/blogs">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const mins = readMinutes(post.content);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative border-b border-border">
        {post.cover_image_url ? (
          <>
            <div className="absolute inset-0 max-h-[520px] overflow-hidden">
              <img
                src={post.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 max-h-[520px] bg-gradient-to-br from-primary/20 via-card to-background" />
        )}

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-10 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blogs" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[180px] sm:max-w-xs">{post.title}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-primary/40 text-primary bg-primary/10 mb-6">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDate(post.updated_at || post.created_at)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> {mins} min read
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="py-14 lg:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12 xl:gap-16">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-none prose-img:border prose-img:border-border
                  prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                  prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1.5 border border-border text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/blogs">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> All posts
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      void navigator.share({ title: post.title, url: window.location.href });
                    } else {
                      void navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </motion.article>

            <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
              <div className="bg-card border border-border p-6">
                <h3 className="font-display font-bold text-lg mb-4">Need a vehicle?</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Get a quote for self-drive or chauffeur rentals across East Africa.
                </p>
                <Link href="/contact">
                  <Button className="w-full font-display font-bold uppercase tracking-wider text-xs">
                    Request a quote
                  </Button>
                </Link>
              </div>

              {related.length > 0 && (
                <div className="bg-card border border-border p-6">
                  <h3 className="font-display font-bold text-lg mb-5 border-b border-border pb-3">
                    More to read
                  </h3>
                  <ul className="space-y-5">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/blogs/${r.slug}`}>
                          <div className="group cursor-pointer">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                              {r.category}
                            </p>
                            <p className="font-display font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {r.title}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 group-hover:text-primary">
                              Read <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
