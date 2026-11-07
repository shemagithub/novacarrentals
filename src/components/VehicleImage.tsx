import { OptimizedImage } from "@/components/OptimizedImage";
import { fleetCategoryFallback, resolveFleetImageUrl } from "@/lib/fleet-images";

type VehicleImageProps = {
  src?: string | null;
  category: string;
  name: string;
  alt?: string;
  className?: string;
  width?: number;
  sizes?: string;
  priority?: boolean;
};

/** Fleet photo with automatic category stock fallback when API assets 404. */
export function VehicleImage({
  src,
  category,
  name,
  alt,
  className,
  width = 800,
  sizes,
  priority = false,
}: VehicleImageProps) {
  const fallback = fleetCategoryFallback(category, name);
  const primary = resolveFleetImageUrl(src, category, name);

  return (
    <OptimizedImage
      src={primary}
      fallbackSrc={fallback !== primary ? fallback : undefined}
      alt={alt || name}
      className={className}
      width={width}
      sizes={sizes}
      priority={priority}
    />
  );
}
