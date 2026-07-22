import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

const FALLBACK = ["SUV", "Sedan", "Luxury", "Van", "Pickup", "Economy", "Sports", "Truck"];

/**
 * Active vehicle category names for select fields (sorted by display_order).
 */
export function useVehicleCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/vehicle-categories");
      const rows = Array.isArray(data) ? data : [];
      const active = rows
        .filter((r) => r.is_active !== false && String(r.name || "").trim())
        .sort(
          (a, b) =>
            (Number(a.display_order) || 0) - (Number(b.display_order) || 0) ||
            String(a.name).localeCompare(String(b.name)),
        )
        .map((r) => String(r.name).trim());
      setCategories(active.length ? active : [...FALLBACK]);
    } catch {
      setCategories([...FALLBACK]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, refresh };
}
