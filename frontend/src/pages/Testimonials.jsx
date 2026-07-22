import ResourcePage from "@/components/ResourcePage";
import { fileImageSrcFromStored } from "@/lib/api";

function StarRow({ value }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Testimonials() {
  return (
    <ResourcePage
      resource="testimonials"
      title="Testimonials"
      description="Quotes shown on your marketing site — guest name, photo, star rating, and display order."
      actionLabel="Add testimonial"
      formModalMaxClass="max-w-2xl lg:max-w-3xl"
      columns={[
        {
          key: "profile_image",
          label: "Photo",
          render: (i) =>
            i.profile_image ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                <img
                  src={fileImageSrcFromStored(i.profile_image)}
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
        { key: "name", label: "Name" },
        { key: "role", label: "Customer type" },
        {
          key: "testimonial",
          label: "Testimonial",
          render: (i) => (
            <span className="line-clamp-2 max-w-[min(28rem,50vw)] text-sm text-neutral-800">
              {i.testimonial || "—"}
            </span>
          ),
        },
        {
          key: "rating",
          label: "Rating",
          render: (i) => <StarRow value={i.rating} />,
        },
        {
          key: "is_visible",
          label: "Visible",
          render: (i) =>
            i.is_visible ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Yes
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                No
              </span>
            ),
        },
        { key: "display_order", label: "Order" },
      ]}
      defaults={{
        name: "",
        role: "",
        testimonial: "",
        profile_image: "",
        rating: 5,
        display_order: 0,
        is_visible: true,
      }}
      fields={[
        { key: "name", label: "Name", required: true },
        {
          key: "role",
          label: "Customer type",
          placeholder: "e.g. Business Traveler, Safari Tourist",
        },
        {
          key: "profile_image",
          label: "Profile image",
          type: "imageUpload",
          uploadFolder: "testimonials",
          full: true,
        },
        {
          key: "rating",
          label: "Rating (1–5 stars)",
          type: "number",
          required: true,
          min: 1,
          max: 5,
          step: 1,
          integer: true,
        },
        {
          key: "testimonial",
          label: "Testimonial",
          type: "textarea",
          full: true,
          rows: 5,
          required: true,
        },
        { key: "display_order", label: "Display order", type: "number", integer: true },
        {
          key: "is_visible",
          label: "Show on website",
          type: "checkbox",
          checkboxLabel: "Visible on public /api/public/testimonials",
        },
      ]}
    />
  );
}
