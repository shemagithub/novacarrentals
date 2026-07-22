import { API_BASE, type PublicCmsPage } from "@/lib/api";

export const SERVICES_QUERY_KEY = ["cms-service"] as const;

export async function fetchPublicServicesPage(): Promise<PublicCmsPage> {
  const res = await fetch(`${API_BASE}/public/cms-page/service`, { credentials: "omit" });
  if (!res.ok) {
    throw new Error(`Failed to load services page (${res.status})`);
  }
  return (await res.json()) as PublicCmsPage;
}

export type { PublicCmsPage };
