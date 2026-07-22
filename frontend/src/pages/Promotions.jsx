import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { currencyFieldSuffix } from "@/lib/formatMoney";

export default function Promotions() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);

  return (
    <ResourcePage
      resource="promotions"
      title="Promotions & Coupons"
      description="Run discount campaigns and seasonal promotions."
      actionLabel="New Promotion"
      columns={[
        { key: "code", label: "Code", mono: true },
        { key: "description", label: "Description" },
        { key: "discount_percent", label: "Discount %", render: (i) => <span className="font-mono">{i.discount_percent}%</span> },
        { key: "used_count", label: "Used", render: (i) => <span className="font-mono">{i.used_count}/{i.usage_limit}</span> },
        { key: "valid_until", label: "Expires", render: (i) => <span className="font-mono text-[11px]">{(i.valid_until || "").slice(0, 10)}</span> },
        { key: "is_active", label: "Status", render: (i) => i.is_active ? <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Active</span> : <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">Disabled</span> },
      ]}
      defaults={{ code: "", description: "", discount_percent: 10, discount_amount: 0, valid_from: "", valid_until: "", is_active: true, usage_limit: 100, used_count: 0 }}
      fields={[
        { key: "code", label: "Promo Code", required: true },
        { key: "description", label: "Description", required: true },
        { key: "discount_percent", label: "Discount %", type: "number" },
        { key: "discount_amount", label: `Flat Discount ${sfx}`, type: "number" },
        { key: "valid_from", label: "Valid From", type: "date" },
        { key: "valid_until", label: "Valid Until", type: "date" },
        { key: "usage_limit", label: "Usage Limit", type: "number" },
        { key: "is_active", label: "Active", type: "checkbox", checkboxLabel: "Promotion is currently active" },
      ]}
    />
  );
}
