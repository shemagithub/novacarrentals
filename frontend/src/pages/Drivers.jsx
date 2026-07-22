import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";

export default function Drivers() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);

  return (
    <ResourcePage
      resource="drivers"
      title="Drivers"
      description="Manage chauffeurs — track availability, ratings, salary and trip history."
      actionLabel="Add Driver"
      columns={[
        { key: "full_name", label: "Driver" },
        { key: "phone", label: "Phone", mono: true },
        { key: "license_number", label: "License", mono: true },
        { key: "trips_completed", label: "Trips", render: (i) => <span className="font-mono">{i.trips_completed}</span> },
        { key: "rating", label: "Rating", render: (i) => <span className="font-mono">★ {i.rating}</span> },
        { key: "salary", label: "Salary", render: (i) => <span className="font-mono">{formatMoney(i.salary, currency)}</span> },
        { key: "is_available", label: "Available", render: (i) => i.is_available ? <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">On Duty</span> : <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Off Duty</span> },
      ]}
      defaults={{ full_name: "", phone: "", email: "", license_number: "", is_available: true, salary: 3500, rating: 4.5, trips_completed: 0 }}
      fields={[
        { key: "full_name", label: "Full Name", required: true },
        { key: "phone", label: "Phone", required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "license_number", label: "License No.", required: true },
        { key: "salary", label: `Salary ${sfx}`, type: "number" },
        { key: "rating", label: "Rating (1-5)", type: "number" },
        { key: "trips_completed", label: "Trips Completed", type: "number" },
        { key: "is_available", label: "Available", type: "checkbox", checkboxLabel: "Driver is on duty" },
      ]}
    />
  );
}
