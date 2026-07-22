import ResourcePage from "@/components/ResourcePage";

export default function Tickets() {
  return (
    <ResourcePage
      resource="tickets"
      title="Support Tickets"
      description="Customer complaints and support tickets — assign and resolve."
      actionLabel="New Ticket"
      columns={[
        { key: "subject", label: "Subject" },
        { key: "customer_email", label: "Customer", mono: true },
        { key: "priority", label: "Priority", isStatus: true },
        { key: "status", label: "Status", isStatus: true },
        { key: "created_at", label: "Created", render: (i) => <span className="font-mono text-[11px]">{(i.created_at || "").slice(0, 10)}</span> },
      ]}
      defaults={{ subject: "", customer_email: "", description: "", priority: "medium", status: "open" }}
      fields={[
        { key: "subject", label: "Subject", required: true, full: true },
        { key: "customer_email", label: "Customer Email", type: "email", required: true },
        { key: "description", label: "Description", type: "textarea", full: true, required: true },
        { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
        { key: "status", label: "Status", type: "select", options: ["open", "in_progress", "resolved", "closed"] },
      ]}
    />
  );
}
