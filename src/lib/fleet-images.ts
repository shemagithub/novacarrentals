/** Local stock photos used when the API vehicle-asset file is missing. */
export function fleetCategoryFallback(category: string, name = ""): string {
  const hay = `${category} ${name}`.toLowerCase();
  if (/\b(van|bus|hiace|minibus|coaster|tourist)\b/.test(hay)) {
    return "/images/fleet-van.png";
  }
  if (/\b(sedan|saloon|economy|compact|vitz|corolla|camry)\b/.test(hay)) {
    return "/images/fleet-sedan.png";
  }
  return "/images/fleet-suv.png";
}

/** Prefer the API photo; otherwise a category stock image so cards never look empty. */
export function resolveFleetImageUrl(
  apiUrl: string | null | undefined,
  category: string,
  name = "",
): string {
  const u = (apiUrl || "").trim();
  if (u) return u;
  return fleetCategoryFallback(category, name);
}
