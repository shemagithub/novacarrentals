import { useEffect, useState } from "react";
import { withImageWidth } from "@/lib/optimized-image";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Requested max width sent to the image API (snapped server-side). */
  width?: number;
  sizes?: string;
  priority?: boolean;
};

export function OptimizedImage({
  src,
  alt,
  className,
  width = 800,
  sizes,
  priority = false,
}: OptimizedImageProps) {
  const optimized = withImageWidth(src, width);
  const [currentSrc, setCurrentSrc] = useState(optimized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(withImageWidth(src, width));
    setFailed(false);
  }, [src, width]);

  if (failed || !src) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground/40 ${className ?? ""}`}
        role="img"
        aria-label={alt || "Image unavailable"}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
      onError={() => {
        // Retry the original URL without ?w= in case an older backend rejects it.
        if (currentSrc !== src) {
          setCurrentSrc(src);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
