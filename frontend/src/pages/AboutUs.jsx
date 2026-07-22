import { useEffect, useState } from "react";
import api, { API_BASE, formatAxiosError, fileImageSrcFromStored } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import CmsHtmlBodyEditor from "@/components/cms/CmsHtmlBodyEditor";
import { isCmsHtmlContentEmpty } from "@/lib/cmsHtml";

const ABOUT_KEY = "about";

const DEFAULT_STATS = [
  { label: "Years of Service", value: "8+" },
  { label: "Vehicles in Fleet", value: "150+" },
  { label: "Happy Clients", value: "10k+" },
  { label: "Countries Covered", value: "3" },
];

const DEFAULT_VALUES = [
  {
    title: "Safety First",
    description:
      "Every vehicle is fully insured, regularly serviced, and inspected before every rental. Our maintenance standards exceed regional requirements.",
  },
  {
    title: "Customer Obsession",
    description:
      "From the first inquiry to the final drop-off, we treat every traveler like our most important guest. No hidden charges, no unpleasant surprises.",
  },
  {
    title: "Regional Expertise",
    description:
      "We know the roads of Rwanda, Uganda, and Tanzania like the back of our hand — from the smooth highways of Kigali to the red dirt tracks of Bwindi.",
  },
  {
    title: "Reliable & Responsive",
    description:
      "24/7 availability, real-time communication, and a team that actually picks up the phone. When you need us, we're there.",
  },
];

const DEFAULT_PROMISES = [
  "Transparent pricing — what you see is what you pay",
  "No hidden charges or surprise fees",
  "Dependable support before, during, and after your journey",
  "Professionally cleaned vehicles before every rental",
  "24/7 roadside emergency assistance",
  "Multilingual team: English, French, Kinyarwanda, Swahili",
  "Easy online booking with fast confirmation",
  "Cross-border documentation fully handled",
];

const emptyDoc = {
  key: ABOUT_KEY,
  title: "Built on Trust. Driven by Passion.",
  content: "",
  seo_title: "About Us",
  seo_description: "",
  is_published: true,
  hero_eyebrow: "About NOVACAR",
  story_title: "From Kigali to the Serengeti and Back",
  story_content: "",
  stats: DEFAULT_STATS.map((s) => ({ ...s })),
  values: DEFAULT_VALUES.map((v) => ({ ...v })),
  promises: [...DEFAULT_PROMISES],
  cta_title: "Ready to Experience NOVACAR?",
  cta_description:
    "Book your vehicle today and discover why thousands of travelers, businesses, and organizations trust us across East Africa.",
  story_image_rw: "",
  story_image_ug: "",
  story_image_tz: "",
  story_quote: "Customer satisfaction is our highest priority.",
};

function normalizeStats(raw) {
  const rows = Array.isArray(raw) && raw.length ? raw : DEFAULT_STATS;
  return DEFAULT_STATS.map((fallback, i) => ({
    label: String(rows[i]?.label ?? fallback.label),
    value: String(rows[i]?.value ?? fallback.value),
  }));
}

function normalizeValues(raw) {
  const rows = Array.isArray(raw) && raw.length ? raw : DEFAULT_VALUES;
  return DEFAULT_VALUES.map((fallback, i) => ({
    title: String(rows[i]?.title ?? fallback.title),
    description: String(rows[i]?.description ?? fallback.description),
  }));
}

function normalizePromises(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((p) => String(p ?? "").trim()).filter(Boolean);
  }
  return [...DEFAULT_PROMISES];
}

function docFromApi(found) {
  return {
    id: found.id,
    key: found.key || ABOUT_KEY,
    title: found.title ?? emptyDoc.title,
    content: found.content ?? "",
    seo_title: found.seo_title ?? "",
    seo_description: found.seo_description ?? "",
    is_published: !!found.is_published,
    hero_eyebrow: found.hero_eyebrow ?? emptyDoc.hero_eyebrow,
    story_title: found.story_title ?? emptyDoc.story_title,
    story_content: found.story_content ?? "",
    stats: normalizeStats(found.stats),
    values: normalizeValues(found.values),
    promises: normalizePromises(found.promises),
    cta_title: found.cta_title ?? emptyDoc.cta_title,
    cta_description: found.cta_description ?? emptyDoc.cta_description,
    story_image_rw: found.story_image_rw ?? "",
    story_image_ug: found.story_image_ug ?? "",
    story_image_tz: found.story_image_tz ?? "",
    story_quote: found.story_quote ?? emptyDoc.story_quote,
  };
}

export default function AboutUs() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/cms_pages");
        const rows = Array.isArray(data) ? data : [];
        const found = rows.find((p) => String(p.key || "").toLowerCase() === ABOUT_KEY);
        if (!cancelled) {
          setDoc(found ? docFromApi(found) : { ...emptyDoc, stats: normalizeStats(), values: normalizeValues() });
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(formatAxiosError(e));
          setDoc({ ...emptyDoc, stats: normalizeStats(), values: normalizeValues() });
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

  const updateStat = (index, field, value) => {
    const stats = [...doc.stats];
    stats[index] = { ...stats[index], [field]: value };
    update("stats", stats);
  };

  const updateValue = (index, field, value) => {
    const values = [...doc.values];
    values[index] = { ...values[index], [field]: value };
    update("values", values);
  };

  const uploadStoryImage = async (fieldKey, file) => {
    if (!file) return;
    setUploadingImageKey(fieldKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads?folder=cms/about", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update(fieldKey, data.path);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingImageKey(null);
    }
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const payload = {
        key: ABOUT_KEY,
        title: doc.title?.trim(),
        content: doc.content,
        seo_title: doc.seo_title?.trim() ? doc.seo_title.trim() : null,
        seo_description: doc.seo_description?.trim() ? doc.seo_description.trim() : null,
        is_published: !!doc.is_published,
        hero_eyebrow: doc.hero_eyebrow?.trim() ? doc.hero_eyebrow.trim() : null,
        story_title: doc.story_title?.trim() ? doc.story_title.trim() : null,
        story_content: doc.story_content?.trim() ? doc.story_content : null,
        stats: doc.stats.map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
        values: doc.values.map((v) => ({
          title: v.title.trim(),
          description: v.description.trim(),
        })),
        promises: doc.promises.map((p) => String(p).trim()).filter(Boolean),
        cta_title: doc.cta_title?.trim() ? doc.cta_title.trim() : null,
        cta_description: doc.cta_description?.trim() ? doc.cta_description.trim() : null,
        story_image_rw: doc.story_image_rw?.trim() ? doc.story_image_rw.trim() : null,
        story_image_ug: doc.story_image_ug?.trim() ? doc.story_image_ug.trim() : null,
        story_image_tz: doc.story_image_tz?.trim() ? doc.story_image_tz.trim() : null,
        story_quote: doc.story_quote?.trim() ? doc.story_quote.trim() : null,
      };
      if (doc.id) {
        await api.put(`/cms_pages/${doc.id}`, payload);
        toast.success("About page saved");
      } else {
        const { data } = await api.post("/cms_pages", payload);
        setDoc({ ...doc, id: data.id });
        toast.success("About page created");
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

  const publicUrl = `${API_BASE}/public/cms-page/${ABOUT_KEY}`;
  const canSave =
    doc.title?.trim() &&
    !isCmsHtmlContentEmpty(doc.content) &&
    doc.stats.every((s) => s.label.trim() && s.value.trim()) &&
    doc.values.every((v) => v.title.trim() && v.description.trim());

  return (
    <div data-testid="about-us-page">
      <PageHeader
        title="About Us page"
        description="Edit every section of the public /about page on the customer website. When Published is on, the marketing site loads this content from the API below."
      />
      <p className="-mt-2 mb-4 max-w-3xl text-xs text-neutral-500 font-mono break-all" data-testid="about-public-api-url">
        {publicUrl}
      </p>
      <p className="mb-6 text-xs text-neutral-500">
        Per-page SEO (browser tab &amp; meta) can also be edited under{" "}
        <strong>Marketing → Page SEO</strong>. Team members and testimonials are managed separately.
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* Hero */}
        <SectionCard title="Hero section" subtitle="Top banner on /about">
          <Field
            label="Eyebrow label"
            hint='Small text above the headline, e.g. "About NOVACAR"'
            value={doc.hero_eyebrow}
            onChange={(v) => update("hero_eyebrow", v)}
            testId="about-hero-eyebrow"
          />
          <Field
            label="Headline (H1)"
            hint="Use Enter for a line break in the headline."
            value={doc.title}
            onChange={(v) => update("title", v)}
            testId="about-title"
            multiline
          />
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
              Intro paragraph (rich text)
            </label>
            <CmsHtmlBodyEditor
              value={doc.content}
              onChange={(html) => update("content", html)}
              placeholder="Short introduction shown under the headline."
              testId="about-content"
            />
          </div>
        </SectionCard>

        {/* Stats */}
        <SectionCard title="Stats bar" subtitle="Four counters below the hero">
          <div className="grid sm:grid-cols-2 gap-4">
            {doc.stats.map((stat, i) => (
              <div key={i} className="rounded-sm border border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Stat {i + 1}</p>
                <Field
                  label="Value"
                  value={stat.value}
                  onChange={(v) => updateStat(i, "value", v)}
                  testId={`about-stat-value-${i}`}
                />
                <Field
                  label="Label"
                  value={stat.label}
                  onChange={(v) => updateStat(i, "label", v)}
                  testId={`about-stat-label-${i}`}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Story */}
        <SectionCard title="Our Story" subtitle="Two-column story block">
          <Field
            label="Story heading"
            value={doc.story_title}
            onChange={(v) => update("story_title", v)}
            testId="about-story-title"
          />
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
              Story body (rich text)
            </label>
            <CmsHtmlBodyEditor
              value={doc.story_content}
              onChange={(html) => update("story_content", html)}
              placeholder="Company history and mission — multiple paragraphs welcome."
              testId="about-story-content"
            />
          </div>
        </SectionCard>

        {/* Story collage images */}
        <SectionCard
          title="Story collage"
          subtitle="Photo grid beside the story (Rwanda, Uganda, Tanzania + quote block)"
        >
          <p className="text-xs text-neutral-500">
            Upload photos for the three country tiles. If empty, the site shows RW / UG / TZ placeholders.
            Recommended: portrait for Rwanda &amp; Tanzania, square for Uganda.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <StoryImageField
              label="Rwanda (top-left, tall)"
              value={doc.story_image_rw}
              onChange={(v) => update("story_image_rw", v)}
              onUpload={(file) => uploadStoryImage("story_image_rw", file)}
              uploading={uploadingImageKey === "story_image_rw"}
              testId="about-story-image-rw"
              placeholder="RW"
            />
            <StoryImageField
              label="Uganda (top-right, square)"
              value={doc.story_image_ug}
              onChange={(v) => update("story_image_ug", v)}
              onUpload={(file) => uploadStoryImage("story_image_ug", file)}
              uploading={uploadingImageKey === "story_image_ug"}
              testId="about-story-image-ug"
              placeholder="UG"
              aspectClass="aspect-square"
            />
            <StoryImageField
              label="Tanzania (bottom-right, tall)"
              value={doc.story_image_tz}
              onChange={(v) => update("story_image_tz", v)}
              onUpload={(file) => uploadStoryImage("story_image_tz", file)}
              uploading={uploadingImageKey === "story_image_tz"}
              testId="about-story-image-tz"
              placeholder="TZ"
            />
          </div>
          <TextAreaField
            label="Quote overlay (bottom-left tile)"
            value={doc.story_quote}
            onChange={(v) => update("story_quote", v)}
            testId="about-story-quote"
            rows={2}
            hint='Shown in the red quote box, e.g. "Customer satisfaction is our highest priority."'
          />
        </SectionCard>

        {/* Values */}
        <SectionCard title="Values cards" subtitle="Four value pillars">
          <div className="space-y-4">
            {doc.values.map((val, i) => (
              <div key={i} className="rounded-sm border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Value {i + 1}</p>
                <Field
                  label="Title"
                  value={val.title}
                  onChange={(v) => updateValue(i, "title", v)}
                  testId={`about-value-title-${i}`}
                />
                <TextAreaField
                  label="Description"
                  value={val.description}
                  onChange={(v) => updateValue(i, "description", v)}
                  testId={`about-value-desc-${i}`}
                  rows={3}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Promises */}
        <SectionCard title="Our Promise" subtitle="Bullet list in the commitment section">
          <TextAreaField
            label="Promises (one per line)"
            value={doc.promises.join("\n")}
            onChange={(v) => update("promises", v.split("\n"))}
            testId="about-promises"
            rows={8}
            hint="Each line becomes a bullet point on the customer website."
          />
        </SectionCard>

        {/* CTA */}
        <SectionCard title="Bottom call-to-action" subtitle="Red banner at the end of /about">
          <Field
            label="CTA headline"
            value={doc.cta_title}
            onChange={(v) => update("cta_title", v)}
            testId="about-cta-title"
          />
          <TextAreaField
            label="CTA description"
            value={doc.cta_description}
            onChange={(v) => update("cta_description", v)}
            testId="about-cta-desc"
            rows={3}
          />
        </SectionCard>

        {/* SEO */}
        <SectionCard title="SEO" subtitle="Also editable under Page SEO">
          <Field label="SEO title" value={doc.seo_title} onChange={(v) => update("seo_title", v)} testId="about-seo-title" />
          <TextAreaField
            label="SEO description"
            value={doc.seo_description}
            onChange={(v) => update("seo_description", v)}
            testId="about-seo-desc"
            rows={3}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={!!doc.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              data-testid="about-published"
            />
            <span className="text-sm font-medium text-neutral-800">Published (visible on customer website)</span>
          </label>
        </SectionCard>
      </div>

      <div className="mt-6 flex justify-end max-w-3xl">
        <button
          type="button"
          onClick={save}
          disabled={saving || !canSave}
          className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
          data-testid="save-about-button"
        >
          {saving ? "Saving…" : "Save About page"}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="sharp-card p-5 space-y-4">
      <div className="border-b border-neutral-200 pb-3">
        <div className="font-display font-bold text-lg tracking-tight">{title}</div>
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

function TextAreaField({ label, value, onChange, testId, rows = 4, hint }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
        {label}
      </label>
      {hint ? <p className="text-xs text-neutral-500 mb-1.5">{hint}</p> : null}
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

function StoryImageField({ label, value, onChange, onUpload, uploading, testId, placeholder, aspectClass = "aspect-[3/4]" }) {
  const previewSrc = value?.trim()
    ? value.startsWith("http")
      ? value
      : fileImageSrcFromStored(value)
    : "";

  return (
    <div className="rounded-sm border border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</p>
      <div className={`${aspectClass} bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden`}>
        {previewSrc ? (
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-display font-bold text-neutral-300">{placeholder}</span>
        )}
      </div>
      <Field
        label="Image URL or path"
        hint="Upload below or paste an external https:// URL"
        value={value}
        onChange={onChange}
        testId={`${testId}-path`}
      />
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          data-testid={`${testId}-upload`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline">
          {uploading ? "Uploading…" : "Upload image"}
        </span>
      </label>
      {value ? (
        <button
          type="button"
          className="text-xs text-neutral-500 hover:text-[#E60000]"
          onClick={() => onChange("")}
          data-testid={`${testId}-clear`}
        >
          Remove image
        </button>
      ) : null}
    </div>
  );
}
