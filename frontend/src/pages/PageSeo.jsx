import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE, formatAxiosError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

/** Marketing routes → CMS keys (must match src/lib/page-seo.ts ROUTE_CMS_KEYS). */
const MARKETING_PAGES = [
  { key: "home", label: "Home (/)", path: "/", contentEditor: "/home" },
  { key: "fleet", label: "Fleet (/fleet)", path: "/fleet" },
  { key: "service", label: "Services (/services)", path: "/services", contentEditor: "/service" },
  { key: "destinations", label: "Destinations (/destinations)", path: "/destinations", contentEditor: "/destinations" },
  { key: "about", label: "About (/about)", path: "/about", contentEditor: "/about" },
  { key: "contact", label: "Contact (/contact)", path: "/contact" },
  { key: "guides", label: "Guides (/guides)", path: "/guides", contentEditor: "/travel-guides" },
  { key: "blogs", label: "Blog (/blogs)", path: "/blogs" },
];

function emptyDoc(key, title) {
  return {
    key,
    title,
    content: "",
    seo_title: "",
    seo_description: "",
    is_published: true,
  };
}

export default function PageSeo() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/cms_pages");
        const cms = Array.isArray(data) ? data : [];
        const byKey = Object.fromEntries(
          cms.map((p) => [String(p.key || "").toLowerCase(), p]),
        );
        if (!cancelled) {
          setRows(
            MARKETING_PAGES.map((def) => {
              const found = byKey[def.key];
              return {
                ...def,
                id: found?.id ?? null,
                title: found?.title ?? def.label.split(" ")[0],
                content: found?.content ?? "",
                seo_title: found?.seo_title ?? "",
                seo_description: found?.seo_description ?? "",
                is_published: found?.is_published !== false,
              };
            }),
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(formatAxiosError(e));
          setRows(MARKETING_PAGES.map((d) => ({ ...d, ...emptyDoc(d.key, d.label) })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const saveRow = async (row) => {
    setSavingKey(row.key);
    try {
      const payload = {
        key: row.key,
        title: row.title?.trim() || row.label,
        content: row.content ?? "",
        seo_title: row.seo_title?.trim() ? row.seo_title.trim() : null,
        seo_description: row.seo_description?.trim() ? row.seo_description.trim() : null,
        is_published: row.is_published !== false,
      };
      if (row.id) {
        await api.put(`/cms_pages/${row.id}`, payload);
      } else {
        const { data } = await api.post("/cms_pages", payload);
        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, id: data.id } : r)));
      }
      toast.success(`SEO saved for ${row.key}`);
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <div className="text-xs text-neutral-500 font-mono">Loading...</div>;

  return (
    <div data-testid="page-seo-page">
      <PageHeader
        title="Page SEO"
        description="Per-page title and meta description for the public marketing site. Home page title/description also come from Settings → Site SEO when the route is /."
      />

      <div className="mb-6 rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 space-y-1">
        <p>
          Public API:{" "}
          <code className="bg-white px-1">{API_BASE}/public/cms-pages-seo</code>
        </p>
        <p>
          Sitemap: <code className="bg-white px-1">{API_BASE}/public/sitemap.xml</code> · Robots:{" "}
          <code className="bg-white px-1">{API_BASE}/public/robots.txt</code>
        </p>
        <p>
          Dynamic routes use live content: <strong>/fleet/:id</strong> (vehicle + Product schema),{" "}
          <strong>/guides/:slug</strong>, <strong>/blogs/:slug</strong> (Article schema).
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className="sharp-card p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <div className="font-display font-bold text-lg tracking-tight">{row.label}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  CMS key: <code className="bg-neutral-100 px-1">{row.key}</code>
                  {row.path ? (
                    <>
                      {" "}
                      · route <code className="bg-neutral-100 px-1">{row.path}</code>
                    </>
                  ) : null}
                </div>
              </div>
              {row.contentEditor ? (
                <Link
                  to={row.contentEditor}
                  className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline"
                >
                  Edit page content →
                </Link>
              ) : null}
            </div>

            <Field
              label="Page title (fallback if SEO title empty)"
              value={row.title}
              onChange={(v) => updateRow(row.key, "title", v)}
              testId={`page-seo-title-${row.key}`}
            />
            <Field
              label="SEO title (browser tab & social)"
              value={row.seo_title}
              onChange={(v) => updateRow(row.key, "seo_title", v)}
              testId={`page-seo-seo-title-${row.key}`}
              hint='Shown as "SEO title | Company name" on the marketing site.'
            />
            <TextAreaField
              label="Meta description"
              value={row.seo_description}
              onChange={(v) => updateRow(row.key, "seo_description", v)}
              testId={`page-seo-desc-${row.key}`}
              rows={3}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => saveRow(row)}
                disabled={savingKey === row.key}
                className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm"
                data-testid={`save-page-seo-${row.key}`}
              >
                {savingKey === row.key ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, testId, hint }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
        {label}
      </label>
      {hint ? <p className="text-xs text-neutral-500 mb-1.5">{hint}</p> : null}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        data-testid={testId}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, testId, rows = 4 }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[4.5rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        data-testid={testId}
      />
    </div>
  );
}
