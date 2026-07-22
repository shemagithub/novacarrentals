import ResourcePage from "@/components/ResourcePage";

export default function Branches() {
  return (
    <ResourcePage
      resource="branches"
      title="Branches & Locations"
      description="Manage pickup/return locations and branch managers."
      actionLabel="Add Branch"
      columns={[
        { key: "name", label: "Branch" },
        { key: "city", label: "City" },
        { key: "address", label: "Address" },
        { key: "manager", label: "Manager" },
        { key: "phone", label: "Phone", mono: true },
        { key: "is_pickup", label: "Pickup", render: (i) => i.is_pickup ? "✓" : "—" },
        { key: "is_return", label: "Return", render: (i) => i.is_return ? "✓" : "—" },
      ]}
      defaults={{ name: "", city: "", address: "", manager: "", phone: "", email: "", is_pickup: true, is_return: true }}
      fields={[
        { key: "name", label: "Branch Name", required: true },
        { key: "city", label: "City", required: true },
        { key: "address", label: "Address", full: true, required: true },
        { key: "manager", label: "Manager Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email", type: "email" },
        { key: "lat", label: "Latitude", type: "number" },
        { key: "lng", label: "Longitude", type: "number" },
        { key: "is_pickup", label: "Pickup Location", type: "checkbox", checkboxLabel: "Used for pickups" },
        { key: "is_return", label: "Return Location", type: "checkbox", checkboxLabel: "Used for returns" },
      ]}
    />
  );
}
