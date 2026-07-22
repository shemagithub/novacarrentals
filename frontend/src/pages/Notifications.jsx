import ResourcePage from "@/components/ResourcePage";

export default function NotificationsPage() {
  return (
    <ResourcePage
      resource="notifications"
      title="Notifications Center"
      description="In-app notifications, email alerts, SMS and WhatsApp messages."
      actionLabel="Send Notification"
      columns={[
        { key: "type", label: "Type", render: (i) => <span className="text-[10px] uppercase tracking-wider font-semibold">{i.type}</span> },
        { key: "title", label: "Title" },
        { key: "message", label: "Message" },
        { key: "channel", label: "Channel", render: (i) => <span className="text-[10px] uppercase tracking-wider font-mono">{i.channel}</span> },
        { key: "is_read", label: "Read", render: (i) => i.is_read ? "✓" : "—" },
        { key: "created_at", label: "Date", render: (i) => <span className="font-mono text-[11px]">{(i.created_at || "").slice(0, 10)}</span> },
      ]}
      defaults={{ type: "system", title: "", message: "", channel: "in_app", recipient_email: "", is_read: false }}
      fields={[
        { key: "type", label: "Type", type: "select", options: ["booking", "payment", "maintenance", "system"] },
        { key: "title", label: "Title", required: true, full: true },
        { key: "message", label: "Message", type: "textarea", full: true, required: true },
        { key: "channel", label: "Channel", type: "select", options: ["in_app", "email", "sms", "whatsapp"] },
        { key: "recipient_email", label: "Recipient email", hint: "Required when channel is Email; otherwise uses admin notification inbox." },
        { key: "is_read", label: "Read", type: "checkbox" },
      ]}
    />
  );
}
