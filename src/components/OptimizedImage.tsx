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
  return (
    <img
      src={withImageWidth(src, width)}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
    />
  );
}
