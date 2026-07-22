import ResourcePage from "@/components/ResourcePage";
import { fileImageSrcFromStored } from "@/lib/api";

export default function Blogs() {
  return (
    <ResourcePage
      resource="blogs"
      title="Blog posts"
      description="Create and publish articles for the public site — news, guides, and SEO-friendly content."
      actionLabel="New post"
      formModalMaxClass="max-w-3xl lg:max-w-4xl"
      columns={[
        {
          key: "cover_image",
          label: "Cover",
          render: (i) =>
            i.cover_image ? (
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100">
                <img
                  src={fileImageSrcFromStored(i.cover_image)}
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
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug", mono: true },
        { key: "category", label: "Category" },
        {
          key: "tags",
          label: "Tags",
          render: (i) => (
            <span className="text-[11px] text-neutral-600">
              {Array.isArray(i.tags) ? i.tags.join(", ") : i.tags || "—"}
            </span>
          ),
        },
        { key: "author", label: "Author" },
        {
          key: "is_published",
          label: "Status",
          render: (i) =>
            i.is_published ? (
              <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Published</span>
            ) : (
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">Draft</span>
            ),
        },
        {
          key: "updated_at",
          label: "Updated",
          render: (i) => <span className="font-mono text-[11px]">{(i.updated_at || "").slice(0, 10)}</span>,
        },
      ]}
      defaults={{
        title: "",
        slug: "",
        category: "General",
        tags: "",
        content: "",
        seo_title: "",
        seo_description: "",
        cover_image: "",
        is_published: false,
        author: "Admin",
      }}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "slug", label: "URL slug", required: true },
        {
          key: "cover_image",
          label: "Cover image",
          type: "imageUpload",
          uploadFolder: "blogs",
          full: true,
        },
        { key: "category", label: "Category", required: true },
        { key: "tags", label: "Tags (comma-separated)", type: "tags" },
        { key: "author", label: "Author" },
        {
          key: "content",
          label: "Body",
          type: "htmlEditor",
          full: true,
          required: true,
          uploadFolder: "blogs",
          placeholder: "Write the post — headings, lists, links, and inline images…",
        },
        { key: "seo_title", label: "SEO title" },
        { key: "seo_description", label: "SEO description", type: "textarea", full: true, rows: 4 },
        { key: "is_published", label: "Published", type: "checkbox", checkboxLabel: "Visible on website" },
      ]}
    />
  );
}
