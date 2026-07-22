import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";

export default function Payments() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);

  return (
    <ResourcePage
      resource="payments"
      title="Payments"
      description="Track all payments, deposits, and refunds across booking history."
      actionLabel="Record Payment"
      columns={[
        { key: "reference", label: "Reference", mono: true },
        { key: "booking_id", label: "Booking", render: (i) => <span className="font-mono">{(i.booking_id || "").slice(0, 8)}</span> },
        { key: "amount", label: "Amount", render: (i) => <span className="font-mono font-semibold">{formatMoney(i.amount, currency)}</span> },
        { key: "method", label: "Method", render: (i) => <span className="capitalize">{(i.method || "").replace(/_/g, " ")}</span> },
        { key: "type", label: "Type", render: (i) => <span className="capitalize">{i.type}</span> },
        { key: "status", label: "Status", isStatus: true },
        { key: "created_at", label: "Date", render: (i) => <span className="font-mono text-[11px]">{(i.created_at || "").slice(0, 10)}</span> },
      ]}
      defaults={{ booking_id: "", customer_id: "", amount: 0, method: "card", type: "payment", status: "completed", reference: "" }}
      fields={[
        { key: "booking_id", label: "Booking ID" },
        { key: "customer_id", label: "Customer ID" },
        { key: "amount", label: `Amount ${sfx}`, type: "number", required: true },
        { key: "method", label: "Method", type: "select", options: ["card", "cash", "bank_transfer", "mobile_money"], required: true },
        { key: "type", label: "Type", type: "select", options: ["payment", "deposit", "refund"], required: true },
        { key: "status", label: "Status", type: "select", options: ["pending", "completed", "failed", "refunded"] },
        { key: "reference", label: "Reference" },
      ]}
    />
  );
}
