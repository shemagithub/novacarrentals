import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calendar, Clock, PenLine, User } from "lucide-react";
import { fetchPublicBlogs, type PublicBlogSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useCmsPageSeo } from "@/hooks/useCmsPageSeo";

const categoryStyles: Record<string, string> = {
  News: "bg-primary/15 text-primary border-primary/30",
  Guides: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
  Safari: "bg-amber-900/40 text-amber-300 border-amber-700/50",
  Travel: "bg-sky-900/40 text-sky-300 border-sky-700/50",
  General: "bg-muted text-muted-foreground border-border",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function BlogCard({
  post,
  index,
  featured = false,
}: {
  post: PublicBlogSummary;
  index: number;
  featured?: boolean;
}) {
  const catClass = categoryStyles[post.category] ?? categoryStyles.General;
  const mins = readMinutes(post.excerpt);

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
        className="mb-14"
      >
        <Link href={`/blogs/${post.slug}`}>
          <div className="group grid lg:grid-cols-2 gap-0 bg-card border border-border hover:border-primary/40 transition-colors overflow-hidden cursor-pointer">
            <div className="relative min-h-[280px] lg:min-h-[420px] bg-muted overflow-hidden">
              {post.cover_image_url ? (
                <OptimizedImage
                  src={post.cover_image_url}
                  alt=""
                  width={1280}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-background" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/20" />
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
                Featured
              </span>
              <span className={`inline-flex w-fit text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border mb-4 ${catClass}`}>
                {post.category}
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                {post.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(post.updated_at || post.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {mins} min read
                </span>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-primary group-hover:gap-3 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/blogs/${post.slug}`}>
        <div className="group h-full flex flex-col bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="relative h-52 bg-muted overflow-hidden">
            {post.cover_image_url ? (
              <OptimizedImage
                src={post.cover_image_url}
                alt=""
                width={800}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/15 via-card to-background flex items-center justify-center">
                <PenLine className="w-10 h-10 text-primary/40" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border backdrop-blur-sm ${catClass}`}>
                {post.category}
              </span>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-1">
            <h3 className="font-display font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3 flex-1">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
              <span>{formatDate(post.updated_at || post.created_at)}</span>
              <span className="flex items-center gap-1 text-primary font-semibold uppercase tracking-wider">
                Read <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blogs() {
  useCmsPageSeo("blogs", {
    title: "Blog",
    description: "Travel tips, safari insights, and East Africa driving advice from NovaCar.",
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blogs"],
    queryFn: () => fetchPublicBlogs(50),
  });

  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category || "General"));
    return ["All", ...Array.from(cats).sort()];
  }, [posts]);

  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? posts
        : posts.filter((p) => (p.category || "General") === activeCategory),
    [posts, activeCategory],
  );

  const [featured, ...rest] = filtered;

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
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Journal</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              Stories From the Road.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Travel tips, safari insights, fleet updates, and East Africa driving advice — written by
              the NovaCar team and guest contributors.
            </p>
          </motion.div>
        </div>
      </section>

      {posts.length > 0 && (
        <div className="sticky top-20 z-30 bg-background/90 backdrop-blur border-b border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
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
      )}

      <section className="py-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border">
              <PenLine className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl mb-2">No posts yet</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                New articles will appear here once published from the admin dashboard.
              </p>
              <Link href="/contact">
                <Button variant="outline">Get in touch</Button>
              </Link>
            </div>
          ) : (
            <>
              {featured && activeCategory === "All" && (
                <BlogCard post={featured} index={0} featured />
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeCategory === "All" ? rest : filtered).map((post, i) => (
                  <BlogCard key={post.id} post={post} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Planning a trip?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Browse our fleet or speak with the team for a tailored quote across Rwanda, Uganda, and Tanzania.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/fleet">
              <Button size="lg" className="font-display font-bold uppercase tracking-wider">
                View fleet
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="font-display font-semibold uppercase tracking-wider">
                Contact us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
