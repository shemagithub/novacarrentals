import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";

export default function Maintenance() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);

  return (
    <ResourcePage
      resource="maintenance"
      title="Fleet Maintenance"
      description="Schedule services, log repairs and track maintenance costs across your fleet."
      actionLabel="Schedule Service"
      columns={[
        { key: "vehicle_id", label: "Vehicle", render: (i) => <span className="font-mono">{(i.vehicle_id || "").slice(0, 8)}</span> },
        { key: "type", label: "Type", render: (i) => <span className="capitalize">{(i.type || "").replace(/_/g, " ")}</span> },
        { key: "description", label: "Description" },
        { key: "scheduled_date", label: "Scheduled", render: (i) => <span className="font-mono text-[11px]">{(i.scheduled_date || "").slice(0, 10)}</span> },
        { key: "cost", label: "Cost", render: (i) => <span className="font-mono">{formatMoney(i.cost, currency)}</span> },
        { key: "garage", label: "Garage" },
        { key: "status", label: "Status", isStatus: true },
      ]}
      defaults={{ vehicle_id: "", type: "oil_change", description: "", cost: 0, scheduled_date: "", status: "scheduled", garage: "" }}
      fields={[
        { key: "vehicle_id", label: "Vehicle ID", required: true },
        { key: "type", label: "Type", type: "select", options: ["oil_change", "tire", "repair", "inspection", "other"] },
        { key: "description", label: "Description", type: "textarea", full: true },
        { key: "scheduled_date", label: "Scheduled Date", type: "date" },
        { key: "completed_date", label: "Completed Date", type: "date" },
        { key: "cost", label: `Cost ${sfx}`, type: "number" },
        { key: "garage", label: "Garage" },
        { key: "status", label: "Status", type: "select", options: ["scheduled", "in_progress", "completed", "cancelled"] },
      ]}
    />
  );
}
