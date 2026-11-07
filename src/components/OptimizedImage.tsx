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
  /** Shown when `src` fails (e.g. category stock photo). */
  fallbackSrc?: string;
};

export function OptimizedImage({
  src,
  alt,
  className,
  width = 800,
  sizes,
  priority = false,
  fallbackSrc,
}: OptimizedImageProps) {
  const optimized = withImageWidth(src, width);
  const [currentSrc, setCurrentSrc] = useState(optimized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(withImageWidth(src, width));
    setFailed(false);
  }, [src, width]);

  if (failed || !src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      );
    }
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
        if (currentSrc !== src) {
          setCurrentSrc(src);
          return;
        }
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
