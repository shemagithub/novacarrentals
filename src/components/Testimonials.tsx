import { useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Quote, Loader2 } from "lucide-react";
import { fetchPublicTestimonials, type PublicTestimonial } from "@/lib/api";
import { OptimizedImage } from "@/components/OptimizedImage";

export const TESTIMONIALS_QUERY_KEY = ["public-testimonials"] as const;

const AVATAR_COLORS = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600"];

export interface Review {
  id: string;
  name: string;
  customerType: string;
  rating: number;
  text: string;
  initials: string;
  avatarColor: string;
  profileImageUrl?: string | null;
}

function mapApiTestimonial(t: PublicTestimonial, index: number): Review {
  const initials = t.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: t.id || `${t.name}-${index}`,
    name: t.name,
    customerType: (t.role || "").trim(),
    rating: t.rating,
    text: t.testimonial,
    initials: initials || "?",
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    profileImageUrl: t.profile_image_url,
  };
}

function formatAverageRating(reviews: Review[]): string {
  if (!reviews.length) return "—";
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, compact = false }: { review: Review; compact?: boolean }) {
  const displayName = review.customerType ? `${review.name} — ${review.customerType}` : review.name;

  return (
    <div
      className={`bg-card border border-border flex-shrink-0 flex flex-col group hover:border-primary/40 transition-colors duration-300 ${
        compact ? "w-80 p-5" : "w-96 p-6"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <Quote className="w-6 h-6 text-primary/30 shrink-0" />
        <StarRating rating={review.rating} />
      </div>

      <p className={`text-muted-foreground leading-relaxed flex-1 mb-5 italic ${compact ? "text-xs" : "text-sm"}`}>
        "{review.text}"
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {review.profileImageUrl ? (
          <OptimizedImage
            src={review.profileImageUrl}
            alt=""
            width={400}
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full ${review.avatarColor} flex items-center justify-center shrink-0`}>
            <span className="text-white text-xs font-bold">{review.initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground truncate">{displayName}</p>
          <p className="text-[11px] text-muted-foreground truncate">Verified Customer</p>
        </div>
      </div>
    </div>
  );
}

/** Infinite-scroll marquee row */
function MarqueeRow({ reviews, reverse = false }: { reviews: Review[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf: number;
    let x = reverse ? -el.scrollWidth / 2 : 0;
    const speed = reverse ? -0.4 : 0.4;

    function tick() {
      x += speed;
      if (!reverse && x >= el!.scrollWidth / 2) x = 0;
      if (reverse && x <= -el!.scrollWidth / 2) x = 0;
      el!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const doubled = [...reviews, ...reviews];

  return (
    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
      <div ref={trackRef} className="flex gap-5 will-change-transform w-max">
        {doubled.map((r, i) => (
          <ReviewCard key={`${r.id}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}

interface TestimonialsSectionProps {
  /** Show the full marquee (for Home page) or a compact grid (for About page) */
  variant?: "marquee" | "grid";
}

export function TestimonialsSection({ variant = "marquee" }: TestimonialsSectionProps) {
  const { data: apiReviews = [], isLoading, isFetched } = useQuery({
    queryKey: TESTIMONIALS_QUERY_KEY,
    queryFn: () => fetchPublicTestimonials(50),
    staleTime: 60_000,
  });

  const reviews = useMemo(() => apiReviews.map(mapApiTestimonial), [apiReviews]);

  const averageRating = formatAverageRating(reviews);
  const reviewCount = reviews.length;

  const row1 = reviews.slice(0, Math.ceil(reviews.length / 2));
  const row2 = reviews.slice(Math.ceil(reviews.length / 2));

  if (isLoading && !isFetched) {
    return (
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading reviews…
        </div>
      </section>
    );
  }

  if (!reviews.length) {
    return null;
  }

  if (variant === "grid") {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
          >
            <ReviewCard review={r} compact />
          </motion.div>
        ))}
      </div>
    );
  }

  const filledStars = Math.round(
    reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.length, 1),
  );

  return (
    <section className="py-24 bg-card border-y border-border overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Verified Reviews</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3">
              Trusted by Thousands
              <br />
              Across East Africa.
            </h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= filledStars ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                  />
                ))}
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{averageRating} / 5</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Rating</p>
            </div>
            <div className="w-px h-14 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">{reviewCount}+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified Reviews</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-5">
        {row1.length > 0 ? <MarqueeRow reviews={row1} /> : null}
        {row2.length > 0 ? <MarqueeRow reviews={row2} reverse /> : null}
      </div>
    </section>
  );
}
