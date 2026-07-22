import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api, { formatAxiosError, fileImageSrcFromStored } from "@/lib/api";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney } from "@/lib/formatMoney";
import { PageHeader } from "@/components/PageHeader";
import { useConfirm } from "@/components/ConfirmProvider";
import CmsHtmlBodyEditor from "@/components/cms/CmsHtmlBodyEditor";
import { isCmsHtmlContentEmpty } from "@/lib/cmsHtml";
import { PencilSimple, Trash, Plus, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

const RESOURCE = "travel-guides";
const CATEGORIES = ["Wildlife Safari", "Game Drive", "City Guide", "City & Nature", "Road Trip"];
const GRADIENTS = [
  "from-emerald-950 via-green-900 to-emerald-800",
  "from-amber-950 via-amber-900 to-amber-800",
  "from-blue-950 via-blue-900 to-blue-800",
  "from-green-950 via-teal-900 to-teal-800",
  "from-sky-950 via-sky-900 to-sky-800",
  "from-cyan-950 via-cyan-900 to-cyan-800",
];

const emptyGuide = () => ({
  slug: "",
  title: "",
  subtitle: "",
  category: "Road Trip",
  country: "",
  flag: "",
  read_time: "5 min read",
  cover_gradient: GRADIENTS[0],
  cover_image: "",
  card_image: "",
  gallery_images: [""],
  accent_color: "text-emerald-400",
  tags: "",
  intro: "",
  sections: [{ heading: "", body: "", tip: "", image: "" }],
  recommended_vehicles: [{ id: "", name: "", reason: "" }],
  practical_info: [{ label: "", value: "" }],
  best_months: "",
  difficulty: "Moderate",
  cta_text: "Book your vehicle for this journey",
  seo_title: "",
  seo_description: "",
  display_order: 0,
  is_published: false,
});

function fromApi(row) {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    category: row.category ?? "Road Trip",
    country: row.country ?? "",
    flag: row.flag ?? "",
    read_time: row.read_time ?? "5 min read",
    cover_gradient: row.cover_gradient ?? GRADIENTS[0],
    cover_image: row.cover_image ?? "",
    card_image: row.card_image ?? "",
    gallery_images:
      Array.isArray(row.gallery_images) && row.gallery_images.length
        ? row.gallery_images.map((u) => String(u ?? ""))
        : [""],
    accent_color: row.accent_color ?? "text-emerald-400",
    tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags ?? "",
    intro: row.intro ?? "",
    sections:
      Array.isArray(row.sections) && row.sections.length
        ? row.sections.map((s) => ({
            heading: s.heading ?? "",
            body: s.body ?? "",
            tip: s.tip ?? "",
            image: s.image ?? "",
          }))
        : [{ heading: "", body: "", tip: "", image: "" }],
    recommended_vehicles:
      Array.isArray(row.recommended_vehicles) && row.recommended_vehicles.length
        ? row.recommended_vehicles.map((v) => ({
            id: v.id ?? "",
            name: v.name ?? "",
            reason: v.reason ?? "",
          }))
        : [{ id: "", name: "", reason: "" }],
    practical_info:
      Array.isArray(row.practical_info) && row.practical_info.length
        ? row.practical_info.map((p) => ({ label: p.label ?? "", value: p.value ?? "" }))
        : [{ label: "", value: "" }],
    best_months: row.best_months ?? "",
    difficulty: row.difficulty ?? "Moderate",
    cta_text: row.cta_text ?? "Book your vehicle for this journey",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    display_order: Number(row.display_order) || 0,
    is_published: !!row.is_published,
  };
}

function normalizeGuideSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 160);
}

function toPayload(form) {
  const tags = String(form.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    slug: normalizeGuideSlug(form.slug),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    category: form.category,
    country: form.country.trim(),
    flag: form.flag.trim(),
    read_time: form.read_time.trim() || "5 min read",
    cover_gradient: form.cover_gradient,
    cover_image: form.cover_image?.trim() ? form.cover_image.trim() : null,
    card_image: form.card_image?.trim() ? form.card_image.trim() : null,
    gallery_images: (form.gallery_images || [])
      .map((u) => String(u || "").trim())
      .filter(Boolean),
    accent_color: form.accent_color.trim() || "text-emerald-400",
    tags,
    intro: form.intro,
    sections: form.sections
      .map((s) => ({
        heading: s.heading.trim(),
        body: s.body.trim(),
        tip: s.tip?.trim() ? s.tip.trim() : null,
        image: s.image?.trim() ? s.image.trim() : null,
      }))
      .filter((s) => s.heading || s.body || s.image),
    recommended_vehicles: form.recommended_vehicles
      .map((v) => ({
        id: v.id.trim(),
        name: v.name.trim(),
        reason: v.reason.trim(),
      }))
      .filter((v) => v.id),
    practical_info: form.practical_info
      .map((p) => ({ label: p.label.trim(), value: p.value.trim() }))
      .filter((p) => p.label || p.value),
    best_months: form.best_months.trim(),
    difficulty: form.difficulty.trim() || "Moderate",
    cta_text: form.cta_text.trim() || "Book your vehicle for this journey",
    seo_title: form.seo_title?.trim() ? form.seo_title.trim() : null,
    seo_description: form.seo_description?.trim() ? form.seo_description.trim() : null,
    display_order: Number(form.display_order) || 0,
    is_published: !!form.is_published,
  };
}

function vehicleDisplayName(v) {
  return (v?.name || [v?.brand, v?.model_name].filter(Boolean).join(" ")).trim() || "Unnamed vehicle";
}

export default function TravelGuides() {
  const { currency } = useBranding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyGuide());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const confirm = useConfirm();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/${RESOURCE}`);
      const rows = Array.isArray(data) ? data : [];
      rows.sort(
        (a, b) =>
          (Number(a.display_order) || 0) - (Number(b.display_order) || 0) ||
          String(a.title || "").localeCompare(String(b.title || "")),
      );
      setItems(rows);
    } catch (e) {
      toast.error(formatAxiosError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    (async () => {
      setFleetLoading(true);
      try {
        const { data } = await api.get("/vehicles");
        if (!cancelled) {
          setFleetVehicles(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setFleetVehicles([]);
      } finally {
        if (!cancelled) setFleetLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showForm]);

  const pickRecommendedVehicle = (index, vehicleId) => {
    if (!vehicleId) {
      setForm((f) => {
        const list = [...f.recommended_vehicles];
        list[index] = { ...list[index], id: "", name: "" };
        return { ...f, recommended_vehicles: list };
      });
      return;
    }
    const v = fleetVehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    setForm((f) => {
      const list = [...f.recommended_vehicles];
      list[index] = {
        ...list[index],
        id: v.id,
        name: vehicleDisplayName(v),
      };
      return { ...f, recommended_vehicles: list };
    });
  };

  const usedVehicleIds = form.recommended_vehicles.map((r) => r.id).filter(Boolean);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyGuide());
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm(fromApi(row));
    setShowForm(true);
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateGallery = (index, value) => {
    setForm((f) => {
      const gallery = [...f.gallery_images];
      gallery[index] = value;
      return { ...f, gallery_images: gallery };
    });
  };

  const updateList = (key, index, field, value) => {
    if (key === "gallery_images") {
      updateGallery(index, value);
      return;
    }
    setForm((f) => {
      const list = [...f[key]];
      list[index] = { ...list[index], [field]: value };
      return { ...f, [key]: list };
    });
  };

  const addListRow = (key, template) => {
    setForm((f) => ({ ...f, [key]: [...f[key], { ...template }] }));
  };

  const removeListRow = (key, index) => {
    setForm((f) => {
      const list = f[key].filter((_, i) => i !== index);
      return { ...f, [key]: list.length ? list : [{ ...emptyGuide()[key][0] }] };
    });
  };

  const uploadGuideImage = async (file, onPath) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/uploads?folder=guides", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    onPath(data.path);
    toast.success("Image uploaded");
  };

  const uploadToField = async (fieldKey, file) => {
    if (!file) return;
    setUploadingImageKey(fieldKey);
    try {
      await uploadGuideImage(file, (path) => update(fieldKey, path));
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingImageKey(null);
    }
  };

  const uploadSectionImage = async (index, file) => {
    if (!file) return;
    const key = `section-${index}`;
    setUploadingImageKey(key);
    try {
      await uploadGuideImage(file, (path) => updateList("sections", index, "image", path));
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingImageKey(null);
    }
  };

  const uploadGalleryImage = async (index, file) => {
    if (!file) return;
    const key = `gallery-${index}`;
    setUploadingImageKey(key);
    try {
      await uploadGuideImage(file, (path) => updateGallery(index, path));
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingImageKey(null);
    }
  };

  const addGalleryRow = () => {
    setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, ""] }));
  };

  const removeGalleryRow = (index) => {
    setForm((f) => {
      const gallery = f.gallery_images.filter((_, i) => i !== index);
      return { ...f, gallery_images: gallery.length ? gallery : [""] };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) {
      toast.error("Slug and title are required");
      return;
    }
    if (isCmsHtmlContentEmpty(form.intro)) {
      toast.error("Intro is required");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await api.put(`/${RESOURCE}/${editingId}`, payload);
        toast.success("Guide updated");
      } else {
        await api.post(`/${RESOURCE}`, payload);
        toast.success("Guide created");
      }
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(formatAxiosError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const ok = await confirm({
      title: "Delete this travel guide?",
      message: "The guide will be removed from the customer website.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/${RESOURCE}/${id}`);
      toast.success("Guide deleted");
      fetchItems();
    } catch (e) {
      toast.error(formatAxiosError(e));
    }
  };

  return (
    <div data-testid="travel-guides-page">
      <PageHeader
        title="Travel guides"
        description="Create and edit destination guides shown on the customer website at /guides and /guides/:slug."
        action={openCreate}
        actionLabel="New guide"
        actionTestId="new-travel-guide-button"
      />

      <div className="mb-6 rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 space-y-1">
        <p>
          Public API: <code className="bg-white px-1">/api/public/travel-guides</code> ·{" "}
          <code className="bg-white px-1">/api/public/travel-guides/&#123;slug&#125;</code>
        </p>
        <p>
          Listing page SEO &amp; title: edit under{" "}
          <Link to="/page-seo" className="text-[#E60000] font-semibold hover:underline">
            Page SEO → Guides
          </Link>
          .
        </p>
      </div>

      <div className="sharp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[10px] uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 font-semibold w-16">Cover</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500 font-mono text-xs">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500 text-sm">
                    No travel guides yet. Create one to show on the customer website.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const thumbSrc = (item.card_image || item.cover_image)?.trim()
                    ? String(item.card_image || item.cover_image).startsWith("http")
                      ? item.card_image || item.cover_image
                      : fileImageSrcFromStored(item.card_image || item.cover_image)
                    : "";
                  return (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                    <td className="px-4 py-3">
                      {thumbSrc ? (
                        <img src={thumbSrc} alt="" className="h-10 w-14 object-cover rounded-sm border border-neutral-200" />
                      ) : (
                        <span className="text-neutral-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{item.slug}</td>
                    <td className="px-4 py-3 text-neutral-700">{item.category}</td>
                    <td className="px-4 py-3">
                      {item.flag ? `${item.flag} ` : ""}
                      {item.country || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{item.display_order ?? 0}</td>
                    <td className="px-4 py-3">
                      {item.is_published ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 hover:bg-neutral-100 rounded-sm"
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="p-2 hover:bg-red-50 rounded-sm"
                          title="Delete"
                        >
                          <Trash size={16} className="text-[#E60000]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-[6000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-4 w-full max-w-4xl rounded-sm border border-neutral-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="font-display text-xl font-bold">{editingId ? "Edit guide" : "New guide"}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-xs uppercase tracking-wider">
                  Close
                </button>
              </div>
              <form onSubmit={save} className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6 space-y-6">
                <Section title="Basics">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Title *" value={form.title} onChange={(v) => update("title", v)} />
                    <Field
                      label="URL slug *"
                      value={form.slug}
                      onChange={(v) => update("slug", v)}
                      hint="e.g. gorilla-trekking-uganda"
                    />
                    <Field label="Subtitle" value={form.subtitle} onChange={(v) => update("subtitle", v)} full />
                    <Select label="Category" value={form.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
                    <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
                    <Field label="Flag emoji" value={form.flag} onChange={(v) => update("flag", v)} hint="e.g. 🇺🇬" />
                    <Field label="Read time" value={form.read_time} onChange={(v) => update("read_time", v)} />
                    <Field label="Display order" value={form.display_order} onChange={(v) => update("display_order", v)} type="number" />
                  </div>
                  <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => update("tags", v)} full />
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Intro *</label>
                    <CmsHtmlBodyEditor value={form.intro} onChange={(v) => update("intro", v)} imageUploadFolder="guides" />
                  </div>
                </Section>

                <Section title="Images">
                  <p className="text-xs text-neutral-500">
                    Hero image appears on the guide detail page. Card image is used on the /guides listing (falls back to hero if empty).
                    Gallery photos show in a row on the guide page. Section images appear inside each content block.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <GuideImageField
                      label="Hero cover image"
                      hint="Wide banner on /guides/:slug"
                      value={form.cover_image}
                      onChange={(v) => update("cover_image", v)}
                      onUpload={(file) => uploadToField("cover_image", file)}
                      uploading={uploadingImageKey === "cover_image"}
                      testId="guide-cover-image"
                      aspectClass="aspect-[21/9]"
                    />
                    <GuideImageField
                      label="Listing card image"
                      hint="Thumbnail on /guides grid (optional)"
                      value={form.card_image}
                      onChange={(v) => update("card_image", v)}
                      onUpload={(file) => uploadToField("card_image", file)}
                      uploading={uploadingImageKey === "card_image"}
                      testId="guide-card-image"
                      aspectClass="aspect-video"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Photo gallery</p>
                    {form.gallery_images.map((img, i) => (
                      <GuideImageField
                        key={i}
                        label={`Gallery photo ${i + 1}`}
                        value={img}
                        onChange={(v) => updateGallery(i, v)}
                        onUpload={(file) => uploadGalleryImage(i, file)}
                        uploading={uploadingImageKey === `gallery-${i}`}
                        testId={`guide-gallery-${i}`}
                        aspectClass="aspect-video"
                        compact
                        onRemove={form.gallery_images.length > 1 ? () => removeGalleryRow(i) : null}
                      />
                    ))}
                    <button type="button" onClick={addGalleryRow} className="flex items-center gap-1 text-xs font-semibold uppercase text-[#E60000]">
                      <Plus size={14} /> Add gallery photo
                    </button>
                  </div>

                  <Select label="Gradient fallback (when no hero image)" value={form.cover_gradient} onChange={(v) => update("cover_gradient", v)} options={GRADIENTS} full />
                  <Field label="Accent CSS class" value={form.accent_color} onChange={(v) => update("accent_color", v)} hint="e.g. text-emerald-400" />
                </Section>

                <Section title="Content sections">
                  {form.sections.map((sec, i) => (
                    <div key={i} className="rounded-sm border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase text-neutral-500">Section {i + 1}</span>
                        {form.sections.length > 1 ? (
                          <button type="button" className="text-xs text-[#E60000]" onClick={() => removeListRow("sections", i)}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <Field label="Heading" value={sec.heading} onChange={(v) => updateList("sections", i, "heading", v)} full />
                      <GuideImageField
                        label="Section image (optional)"
                        value={sec.image}
                        onChange={(v) => updateList("sections", i, "image", v)}
                        onUpload={(file) => uploadSectionImage(i, file)}
                        uploading={uploadingImageKey === `section-${i}`}
                        testId={`guide-section-image-${i}`}
                        aspectClass="aspect-video"
                        compact
                      />
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Body</label>
                        <CmsHtmlBodyEditor value={sec.body} onChange={(v) => updateList("sections", i, "body", v)} imageUploadFolder="guides" />
                      </div>
                      <Field label="Tip (optional)" value={sec.tip} onChange={(v) => updateList("sections", i, "tip", v)} full />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListRow("sections", { heading: "", body: "", tip: "", image: "" })}
                    className="flex items-center gap-1 text-xs font-semibold uppercase text-[#E60000]"
                  >
                    <Plus size={14} /> Add section
                  </button>
                </Section>

                <Section title="Practical info">
                  {form.practical_info.map((row, i) => (
                    <div key={i} className="grid md:grid-cols-2 gap-3 items-end">
                      <Field label="Label" value={row.label} onChange={(v) => updateList("practical_info", i, "label", v)} />
                      <Field label="Value" value={row.value} onChange={(v) => updateList("practical_info", i, "value", v)} />
                      {form.practical_info.length > 1 ? (
                        <button type="button" className="text-xs text-[#E60000] md:col-span-2 text-left" onClick={() => removeListRow("practical_info", i)}>
                          Remove row
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button type="button" onClick={() => addListRow("practical_info", { label: "", value: "" })} className="flex items-center gap-1 text-xs font-semibold uppercase text-[#E60000]">
                    <Plus size={14} /> Add info row
                  </button>
                </Section>

                <Section title="Recommended vehicles">
                  <p className="text-xs text-neutral-500">
                    Choose vehicles from your fleet database. They appear on the customer guide page with links to{" "}
                    <code className="bg-neutral-100 px-1">/fleet/:id</code>.
                  </p>
                  {fleetLoading ? (
                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-2">
                      <SpinnerGap size={14} className="animate-spin" /> Loading fleet…
                    </p>
                  ) : fleetVehicles.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                      No vehicles in the database yet. Add vehicles under{" "}
                      <Link to="/vehicles" className="font-semibold underline">
                        Fleet → Vehicles
                      </Link>{" "}
                      first.
                    </p>
                  ) : null}
                  {form.recommended_vehicles.map((row, i) => {
                    const selected = fleetVehicles.find((v) => v.id === row.id);
                    const missingFromFleet = row.id && !selected;
                    return (
                      <div key={i} className="rounded-sm border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                        <VehicleSelect
                          label="Fleet vehicle"
                          value={row.id}
                          vehicles={fleetVehicles}
                          orphanLabel={missingFromFleet ? row.name || row.id : null}
                          usedIds={usedVehicleIds.filter((id) => id !== row.id)}
                          currency={currency}
                          onChange={(id) => pickRecommendedVehicle(i, id)}
                          testId={`guide-vehicle-select-${i}`}
                        />
                        {selected ? (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                            <span>
                              <strong className="text-neutral-800">{selected.category}</strong>
                            </span>
                            {selected.registration_number ? (
                              <span className="font-mono">{selected.registration_number}</span>
                            ) : null}
                            <span>{formatMoney(selected.daily_rate, currency)}/day</span>
                            <span className="capitalize">{selected.status?.replace(/_/g, " ") || "—"}</span>
                          </div>
                        ) : null}
                        <Field
                          label="Why recommend this vehicle"
                          value={row.reason}
                          onChange={(v) => updateList("recommended_vehicles", i, "reason", v)}
                          hint="Shown on the guide sidebar under the vehicle name"
                          full
                        />
                        {form.recommended_vehicles.length > 1 ? (
                          <button type="button" className="text-xs text-[#E60000]" onClick={() => removeListRow("recommended_vehicles", i)}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addListRow("recommended_vehicles", { id: "", name: "", reason: "" })}
                    className="flex items-center gap-1 text-xs font-semibold uppercase text-[#E60000]"
                    disabled={fleetVehicles.length === 0}
                  >
                    <Plus size={14} /> Add vehicle
                  </button>
                </Section>

                <Section title="Trip details & CTA">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Best months" value={form.best_months} onChange={(v) => update("best_months", v)} />
                    <Field label="Difficulty" value={form.difficulty} onChange={(v) => update("difficulty", v)} />
                    <Field label="CTA button text" value={form.cta_text} onChange={(v) => update("cta_text", v)} full />
                  </div>
                </Section>

                <Section title="SEO">
                  <Field label="SEO title" value={form.seo_title} onChange={(v) => update("seo_title", v)} full />
                  <TextArea label="SEO description" value={form.seo_description} onChange={(v) => update("seo_description", v)} />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_published} onChange={(e) => update("is_published", e.target.checked)} />
                    <span className="text-sm font-medium">Published on customer website</span>
                  </label>
                </Section>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs uppercase tracking-wider">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
                  >
                    {saving ? "Saving…" : "Save guide"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4 border-b border-neutral-100 pb-6">
      <h3 className="font-display font-bold text-base tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, hint, full, type = "text" }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      {hint ? <p className="text-xs text-neutral-500 mb-1">{hint}</p> : null}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-sm focus:border-[#E60000] focus:outline-none"
      />
    </div>
  );
}

function VehicleSelect({ label, value, vehicles, orphanLabel, usedIds, currency, onChange, testId }) {
  const sorted = [...vehicles].sort((a, b) => vehicleDisplayName(a).localeCompare(vehicleDisplayName(b)));

  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-sm focus:border-[#E60000] focus:outline-none bg-white"
        data-testid={testId}
      >
        <option value="">— Select from fleet —</option>
        {orphanLabel && value ? (
          <option value={value}>{orphanLabel} (saved — not in current fleet)</option>
        ) : null}
        {sorted.map((v) => {
          const taken = usedIds.includes(v.id);
          const rate = v.daily_rate != null ? formatMoney(v.daily_rate, currency) : "";
          return (
            <option key={v.id} value={v.id} disabled={taken}>
              {vehicleDisplayName(v)}
              {v.category ? ` · ${v.category}` : ""}
              {rate ? ` · ${rate}/day` : ""}
              {taken ? " (already added)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <textarea
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-sm focus:border-[#E60000] focus:outline-none"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-sm focus:border-[#E60000] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function GuideImageField({
  label,
  hint,
  value,
  onChange,
  onUpload,
  uploading,
  testId,
  aspectClass = "aspect-video",
  compact = false,
  onRemove = null,
}) {
  const previewSrc = value?.trim()
    ? value.startsWith("http")
      ? value
      : fileImageSrcFromStored(value)
    : "";

  return (
    <div className={`rounded-sm border border-neutral-200 space-y-2 bg-neutral-50/50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</p>
          {hint ? <p className="text-xs text-neutral-500 mt-0.5">{hint}</p> : null}
        </div>
        {onRemove ? (
          <button type="button" className="text-xs text-[#E60000] shrink-0" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <div className={`${aspectClass} bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden rounded-sm`}>
        {previewSrc ? (
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-400 uppercase tracking-wider">No image</span>
        )}
      </div>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Upload below or paste https:// URL"
        className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-sm focus:border-[#E60000] focus:outline-none"
        data-testid={`${testId}-path`}
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
        <span className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline inline-flex items-center gap-1">
          {uploading ? <SpinnerGap size={14} className="animate-spin" /> : null}
          {uploading ? "Uploading…" : "Upload image"}
        </span>
      </label>
      {value ? (
        <button type="button" className="text-xs text-neutral-500 hover:text-[#E60000]" onClick={() => onChange("")} data-testid={`${testId}-clear`}>
          Clear image
        </button>
      ) : null}
    </div>
  );
}
