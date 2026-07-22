import ResourcePage from "@/components/ResourcePage";
import { fileImageSrcFromStored } from "@/lib/api";

export default function Team() {
  return (
    <ResourcePage
      resource="team_members"
      title="Team"
      description="Staff shown on the public site — roles, bios, photos, and contact details."
      actionLabel="Add member"
      formModalMaxClass="max-w-2xl lg:max-w-3xl"
      columns={[
        {
          key: "photo_path",
          label: "Photo",
          render: (i) =>
            i.photo_path ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                <img
                  src={fileImageSrcFromStored(i.photo_path)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <span className="text-neutral-400">—</span>
            ),
        },
        { key: "full_name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "email", label: "Email", mono: true },
        { key: "phone", label: "Phone", mono: true },
        {
          key: "is_visible",
          label: "Visible",
          render: (i) =>
            i.is_visible ? (
              <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Yes</span>
            ) : (
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">No</span>
            ),
        },
        { key: "display_order", label: "Order" },
      ]}
      defaults={{
        full_name: "",
        role: "",
        email: "",
        phone: "",
        bio: "",
        photo_path: "",
        display_order: 0,
        is_visible: true,
      }}
      fields={[
        { key: "full_name", label: "Full name", required: true },
        { key: "role", label: "Role / title", required: true },
        {
          key: "photo_path",
          label: "Photo",
          type: "imageUpload",
          uploadFolder: "team",
          full: true,
        },
        { key: "email", label: "Email", type: "text" },
        { key: "phone", label: "Phone", type: "text" },
        { key: "bio", label: "Bio", type: "textarea", full: true, rows: 5 },
        { key: "display_order", label: "Display order", type: "number" },
        { key: "is_visible", label: "Show on website", type: "checkbox", checkboxLabel: "Visible to visitors" },
      ]}
    />
  );
}
