import { useEffect, useState } from "react";
import api, { API_BASE, formatAxiosError, fileImageSrcFromStored } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { ArrowSquareOut } from "@phosphor-icons/react";
import CmsHtmlBodyEditor from "@/components/cms/CmsHtmlBodyEditor";
import { isCmsHtmlContentEmpty } from "@/lib/cmsHtml";

const PAGE_KEY = "home";

const MARKETING_SITE =
  (process.env.REACT_APP_PUBLIC_SITE_URL || "https://novacarrentals.com").replace(/\/$/, "");

const emptyDoc = {
  key: PAGE_KEY,
  title: "Drive East Africa.\nYour Way.",
  content:
    "Premium vehicles for Rwanda, Uganda and Tanzania — safari-ready 4x4s, executive sedans, and group transport with 24/7 support.",
  seo_title: "Nova Car Rentals",
  seo_description: "Premium car rentals across Rwanda, Uganda, and Tanzania.",
  is_published: true,
  hero_eyebrow: "East Africa's Trusted Car Rental Partner",
  hero_image: "",
};

function docFromApi(found) {
  return {
    id: found.id,
    key: found.key || PAGE_KEY,
    title: found.title ?? emptyDoc.title,
    content: found.content ?? emptyDoc.content,
    seo_title: found.seo_title ?? emptyDoc.seo_title,
    seo_description: found.seo_description ?? "",
    is_published: !!found.is_published,
    hero_eyebrow: found.hero_eyebrow ?? emptyDoc.hero_eyebrow,
    hero_image: found.hero_image ?? "",
  };
}

export default function HomePage() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/cms_pages");
        const rows = Array.isArray(data) ? data : [];
        const found = rows.find((p) => String(p.key || "").toLowerCase() === PAGE_KEY);
        if (!cancelled) {
          setDoc(found ? docFromApi(found) : { ...emptyDoc });
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(formatAxiosError(e));
          setDoc({ ...emptyDoc });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (k, v) => setDoc({ ...doc, [k]: v });

  const uploadHeroImage = async (file) => {
    if (!file) return;
    setUploadingHero(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads?folder=cms/home", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update("hero_image", data.path);
      toast.success("Hero image uploaded");
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingHero(false);
    }
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const payload = {
        key: PAGE_KEY,
        title: doc.title?.trim(),
        content: doc.content?.trim() ? doc.content : "",
        seo_title: doc.seo_title?.trim() ? doc.seo_title.trim() : null,
        seo_description: doc.seo_description?.trim() ? doc.seo_description.trim() : null,
        is_published: !!doc.is_published,
        hero_eyebrow: doc.hero_eyebrow?.trim() ? doc.hero_eyebrow.trim() : null,
        hero_image: doc.hero_image?.trim() ? doc.hero_image.trim() : null,
      };
      if (doc.id) {
        await api.put(`/cms_pages/${doc.id}`, payload);
        toast.success("Home page hero saved");
      } else {
        const { data } = await api.post("/cms_pages", payload);
        setDoc({ ...doc, id: data.id });
        toast.success("Home page created");
      }
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doc) {
    return <div className="text-xs text-neutral-500 font-mono">Loading...</div>;
  }

  const publicUrl = `${API_BASE}/public/cms-page/${PAGE_KEY}`;
  const heroPreviewSrc = doc.hero_image?.trim()
    ? doc.hero_image.startsWith("http")
      ? doc.hero_image
      : fileImageSrcFromStored(doc.hero_image)
    : "";

  const canSave = doc.title?.trim() && doc.hero_eyebrow?.trim() && !isCmsHtmlContentEmpty(doc.content);

  return (
    <div data-testid="home-page-cms">
      <PageHeader
        title="Home page — Hero"
        description="Controls the top banner on the customer website (https://novacarrentals.com/). Other home sections (stats, services, destinations) are managed on their respective pages."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <a
          href={MARKETING_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline"
        >
          View customer site <ArrowSquareOut size={14} />
        </a>
        <span className="text-neutral-300">|</span>
        <code className="text-xs text-neutral-500 font-mono break-all">{publicUrl}</code>
      </div>

      <div className="mb-6 rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 space-y-1">
        <p>
          <strong>Headline mapping:</strong> First line = main headline; second line (after Enter) = accent text in red.
        </p>
        <p>
          <strong>Also on home:</strong> Stats → About page · Services strip → Services page · Destinations →
          Destinations page · Guides → Travel guides · Browser tab SEO → Page SEO.
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <SectionCard title="Publish" subtitle="When off, the marketing site shows loading/empty hero until published">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!doc.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              className="h-4 w-4 accent-[#E60000]"
              data-testid="home-is-published"
            />
            <span className="text-sm font-medium text-neutral-800">Published on customer website</span>
          </label>
        </SectionCard>

        <SectionCard title="Hero section" subtitle="Full-width banner at the top of /">
          <Field
            label="Badge / eyebrow"
            hint='Small label above the headline, e.g. East Africa Trusted Car Rental Partner'
            value={doc.hero_eyebrow}
            onChange={(v) => update("hero_eyebrow", v)}
            testId="home-hero-eyebrow"
          />
          <Field
            label="Headline (H1)"
            hint='Use Enter for a line break — second line appears as the red accent phrase ("Your Way.").'
            value={doc.title}
            onChange={(v) => update("title", v)}
            testId="home-title"
            multiline
          />
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
              Subheading (rich text)
            </label>
            <p className="text-xs text-neutral-500 mb-1.5">
              Short paragraph under the headline. Plain text or formatted HTML.
            </p>
            <CmsHtmlBodyEditor
              value={doc.content}
              onChange={(html) => update("content", html)}
              placeholder="Premium vehicles for Rwanda, Uganda and Tanzania…"
              testId="home-content"
            />
          </div>

          <div className="rounded-sm border border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Hero background image</p>
            <div className="aspect-[21/9] bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden">
              {heroPreviewSrc ? (
                <img src={heroPreviewSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-neutral-400">No image — falls back to Settings → OG image</span>
              )}
            </div>
            <Field
              label="Image URL or storage path"
              hint="Upload below or paste an external https:// URL"
              value={doc.hero_image}
              onChange={(v) => update("hero_image", v)}
              testId="home-hero-image-path"
            />
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploadingHero}
                onChange={(e) => uploadHeroImage(e.target.files?.[0])}
                data-testid="home-hero-image-upload"
              />
              <span className="bg-white border border-neutral-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:border-[#E60000]">
                {uploadingHero ? "Uploading…" : "Upload image"}
              </span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="SEO (optional)" subtitle="Browser tab & search — also editable under Page SEO">
          <Field
            label="SEO title"
            value={doc.seo_title}
            onChange={(v) => update("seo_title", v)}
            testId="home-seo-title"
          />
          <TextAreaField
            label="Meta description"
            value={doc.seo_description}
            onChange={(v) => update("seo_description", v)}
            testId="home-seo-description"
            rows={3}
          />
        </SectionCard>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !canSave}
            className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
            data-testid="save-home-page"
          >
            {saving ? "Saving…" : "Save home hero"}
          </button>
        </div>
        {!canSave ? (
          <p className="text-xs text-amber-700 text-right">Badge, headline, and subheading are required.</p>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="sharp-card p-5 space-y-4">
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="font-display font-bold text-base tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-neutral-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, testId, hint, multiline = false }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
        {label}
      </label>
      {hint ? <p className="text-xs text-neutral-500 mb-1.5">{hint}</p> : null}
      {multiline ? (
        <textarea
          rows={2}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[3rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
          data-testid={testId}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
          data-testid={testId}
        />
      )}
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
