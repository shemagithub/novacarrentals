import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResourcePage from "@/components/ResourcePage";
import api from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";

export default function VehicleCategories() {
  const [vehicleCounts, setVehicleCounts] = useState({});

  const refreshCounts = useCallback(async () => {
    try {
      const { data } = await api.get("/vehicles");
      const rows = Array.isArray(data) ? data : [];
      const counts = {};
      for (const v of rows) {
        const c = String(v.category || "").trim() || "Uncategorized";
        counts[c] = (counts[c] || 0) + 1;
      }
      setVehicleCounts(counts);
    } catch {
      setVehicleCounts({});
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useAdminBackgroundPoll(refreshCounts, [refreshCounts]);

  return (
    <div>
      <ResourcePage
        resource="vehicle-categories"
        title="Vehicle Categories"
        description="Manage fleet categories used when adding or editing vehicles. Inactive categories are hidden from the vehicle form."
        actionLabel="Add Category"
        columns={[
          { key: "name", label: "Category" },
          {
            key: "description",
            label: "Description",
            render: (i) => (
              <span className="text-neutral-600 text-xs line-clamp-2 max-w-md">
                {i.description?.trim() || "—"}
              </span>
            ),
          },
          { key: "display_order", label: "Order", mono: true },
          {
            key: "is_active",
            label: "Active",
            render: (i) => (i.is_active !== false ? "✓" : "—"),
          },
          {
            key: "_vehicles",
            label: "Vehicles",
            render: (i) => (
              <span className="font-mono text-xs">{vehicleCounts[i.name] ?? 0}</span>
            ),
          },
        ]}
        defaults={{
          name: "",
          description: "",
          display_order: 0,
          is_active: true,
        }}
        fields={[
          { key: "name", label: "Category name", required: true },
          { key: "description", label: "Description", type: "textarea", full: true, rows: 2 },
          { key: "display_order", label: "Display order", type: "number" },
          {
            key: "is_active",
            label: "Active",
            type: "checkbox",
            checkboxLabel: "Show in vehicle category dropdown",
          },
        ]}
      />
      <p className="mt-4 text-xs text-neutral-500">
        Assign categories on the{" "}
        <Link to="/vehicles" className="text-[#E60000] font-semibold hover:underline">
          Vehicles
        </Link>{" "}
        page. A category cannot be deleted while vehicles still use it.
      </p>
    </div>
  );
}
