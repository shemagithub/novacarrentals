import { API_BASE, type PublicCmsPage } from "@/lib/api";

export const DESTINATIONS_QUERY_KEY = ["cms-destinations"] as const;

export async function fetchPublicDestinationsPage(): Promise<PublicCmsPage> {
  const res = await fetch(`${API_BASE}/public/cms-page/destinations`, { credentials: "omit" });
  if (!res.ok) {
    throw new Error(`Failed to load destinations page (${res.status})`);
  }
  return (await res.json()) as PublicCmsPage;
}

export type { PublicCmsPage };
