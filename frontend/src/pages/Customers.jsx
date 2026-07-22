import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";

export default function Customers() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);

  return (
    <ResourcePage
      resource="customers"
      title="Customers"
      description="Manage customer profiles, verify driver licenses, and track loyalty & wallet balance."
      actionLabel="Add Customer"
      columns={[
        { key: "full_name", label: "Customer" },
        { key: "email", label: "Email", mono: true },
        { key: "phone", label: "Phone", mono: true },
        { key: "license_number", label: "License", mono: true },
        { key: "loyalty_points", label: "Loyalty", render: (i) => <span className="font-mono">{i.loyalty_points} pts</span> },
        { key: "wallet_balance", label: "Wallet", render: (i) => <span className="font-mono">{formatMoney(i.wallet_balance, currency)}</span> },
        { key: "is_blacklisted", label: "Status", render: (i) => i.is_blacklisted ? <span className="text-[10px] uppercase tracking-wider text-[#E60000] font-semibold">Blacklisted</span> : <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Active</span> },
      ]}
      defaults={{
        full_name: "", email: "", phone: "", license_number: "", address: "", city: "", country: "",
        emergency_contact: "", is_blacklisted: false, loyalty_points: 0, wallet_balance: 0,
      }}
      fields={[
        { key: "full_name", label: "Full Name", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "phone", label: "Phone", required: true },
        { key: "license_number", label: "Driver License No." },
        { key: "address", label: "Address", full: true },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "emergency_contact", label: "Emergency Contact" },
        { key: "loyalty_points", label: "Loyalty Points", type: "number" },
        { key: "wallet_balance", label: `Wallet Balance ${sfx}`, type: "number" },
        { key: "is_blacklisted", label: "Blacklisted", type: "checkbox", checkboxLabel: "Block this customer from booking" },
      ]}
    />
  );
}
