import { useEffect, useState } from "react";
import api, { API_BASE, formatAxiosError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Plus, Trash } from "@phosphor-icons/react";

const PAGE_KEY = "service";

const ICON_OPTIONS = [
  { value: "car", label: "Car (self-drive)" },
  { value: "user-check", label: "Chauffeur / driver" },
  { value: "plane", label: "Airport / plane" },
  { value: "building", label: "Corporate / building" },
  { value: "camera", label: "Safari / camera" },
  { value: "calendar", label: "Long-term / calendar" },
];

const DEFAULT_ITEMS = [
  {
    icon: "car",
    title: "Self-Drive Car Rental",
    tagline: "Freedom to explore at your pace",
    description:
      "Take the wheel and discover East Africa on your own terms. Perfect for tourists, business professionals, NGOs, expatriates, and residents who prefer independence.",
    perks: [
      "Flexible pick-up and drop-off locations",
      "No minimum duration requirements",
      "Comprehensive insurance included",
      "GPS navigation available on request",
      "24/7 roadside emergency support",
      "Cross-border documentation handled",
    ],
    cta_text: "Book Self-Drive",
    display_order: 0,
  },
  {
    icon: "user-check",
    title: "Chauffeur-Driven Car Hire",
    tagline: "Professional drivers, professional service",
    description:
      "Travel in complete comfort with experienced, professional drivers who know every road across Rwanda, Uganda, and Tanzania.",
    perks: [
      "Vetted, multilingual professional drivers",
      "Punctual and discreet service",
      "Airport meet-and-greet service",
      "Half-day and full-day hire options",
      "Ideal for executives and VIP guests",
      "Available for corporate events and conferences",
    ],
    cta_text: "Book Chauffeur",
    display_order: 1,
  },
  {
    icon: "plane",
    title: "Airport Transfers",
    tagline: "Reliable, on time, every flight",
    description:
      "Stress-free arrivals and departures. We monitor your flight in real time and guarantee your driver will be waiting.",
    perks: [
      "Real-time flight monitoring",
      "Meet & greet with name board",
      "Kigali, Entebbe, Dar es Salaam, Arusha, Zanzibar",
      "Fixed pricing — no surge fees",
      "Prompt, door-to-door service",
      "Available 24 hours a day",
    ],
    cta_text: "Book Airport Transfer",
    display_order: 2,
  },
  {
    icon: "building",
    title: "Corporate Car Rental",
    tagline: "Fleet solutions for businesses and organizations",
    description:
      "Flexible transport for businesses, embassies, NGOs, government institutions, and conference delegates.",
    perks: [
      "Dedicated account management",
      "Monthly invoicing available",
      "Executive sedans, SUVs, and vans",
      "Conference and event transportation",
      "Embassy and diplomatic transport",
      "Scalable — 1 vehicle to full fleet",
    ],
    cta_text: "Request Corporate Quote",
    display_order: 3,
  },
  {
    icon: "camera",
    title: "Safari Vehicle Rental",
    tagline: "Built for the wild",
    description:
      "Fully equipped 4x4 safari vehicles ideal for national park game drives, wildlife photography tours, and gorilla trekking.",
    perks: [
      "Pop-up roof for wildlife photography",
      "Extended fuel range for remote areas",
      "Refrigerator and camping equipment available",
      "Experienced safari driver-guides",
      "All major parks: Serengeti, Bwindi, Akagera",
      "Park permits and logistics assistance",
    ],
    cta_text: "Book Safari Vehicle",
    display_order: 4,
  },
  {
    icon: "calendar",
    title: "Long-Term Car Leasing",
    tagline: "Cost-effective for extended stays",
    description:
      "Cost-effective vehicle leasing for businesses, development projects, consultants, and long-stay visitors.",
    perks: [
      "Weekly and monthly pricing tiers",
      "Full maintenance and servicing included",
      "Swap vehicle if needed during lease",
      "Insurance and roadside assist included",
      "Perfect for expats and project staff",
      "Dedicated fleet manager assigned",
    ],
    cta_text: "Get Leasing Quote",
    display_order: 5,
  },
];

const DEFAULT_PERFECT_FOR = [
  "Business Travel",
  "Family Vacations",
  "Safari Tours",
  "Gorilla Trekking",
  "Wedding Transportation",
  "Conference Transportation",
  "NGO Fleet Hire",
  "Diplomatic Missions",
  "Student Transport",
  "Airport Transfers",
  "Cross-Border Road Trips",
  "Tourism and Adventure",
];

const emptyDoc = {
  key: PAGE_KEY,
  title: "Every Journey,\nFully Covered.",
  content:
    "Whether you need a quick city transfer, a weeklong safari expedition, or a long-term corporate fleet — we have a service tailored to your exact needs.",
  seo_title: "Our Services",
  seo_description: "",
  is_published: true,
  hero_eyebrow: "Our Services",
  service_items: DEFAULT_ITEMS.map((s) => ({ ...s, perks: [...s.perks] })),
  perfect_for_eyebrow: "Perfect For",
  perfect_for_title: "Who We Serve",
  perfect_for_items: [...DEFAULT_PERFECT_FOR],
  bottom_cta_title: "Not Sure Which Service You Need?",
  bottom_cta_description:
    "Our team will help you find the right vehicle and service for your journey. No obligation — just expert advice.",
  bottom_cta_button: "Talk to Our Team",
};

function normalizeItems(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((row, i) => ({
      icon: row?.icon || "car",
      title: String(row?.title ?? ""),
      tagline: String(row?.tagline ?? ""),
      description: String(row?.description ?? ""),
      perks: Array.isArray(row?.perks) && row.perks.length ? row.perks.map((p) => String(p ?? "")) : [""],
      cta_text: String(row?.cta_text ?? "Book Now"),
      display_order: Number(row?.display_order ?? i),
    }));
  }
  return emptyDoc.service_items.map((s) => ({ ...s, perks: [...s.perks] }));
}

function normalizePerfectFor(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((p) => String(p ?? "").trim()).filter(Boolean);
  }
  return [...DEFAULT_PERFECT_FOR];
}

function docFromApi(found) {
  return {
    id: found.id,
    key: found.key || PAGE_KEY,
    title: found.title ?? emptyDoc.title,
    content: found.content ?? emptyDoc.content,
    seo_title: found.seo_title ?? "",
    seo_description: found.seo_description ?? "",
    is_published: !!found.is_published,
    hero_eyebrow: found.hero_eyebrow ?? emptyDoc.hero_eyebrow,
    service_items: normalizeItems(found.service_items),
    perfect_for_eyebrow: found.perfect_for_eyebrow ?? emptyDoc.perfect_for_eyebrow,
    perfect_for_title: found.perfect_for_title ?? emptyDoc.perfect_for_title,
    perfect_for_items: normalizePerfectFor(found.perfect_for_items),
    bottom_cta_title: found.bottom_cta_title ?? emptyDoc.bottom_cta_title,
    bottom_cta_description: found.bottom_cta_description ?? emptyDoc.bottom_cta_description,
    bottom_cta_button: found.bottom_cta_button ?? emptyDoc.bottom_cta_button,
  };
}

export default function ServicePage() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const updateItem = (index, field, value) => {
    const items = [...doc.service_items];
    items[index] = { ...items[index], [field]: value };
    update("service_items", items);
  };

  const updateItemPerks = (index, text) => {
    updateItem(
      index,
      "perks",
      text.split("\n").map((l) => l.trim()).filter(Boolean),
    );
  };

  const addItem = () => {
    update("service_items", [
      ...doc.service_items,
      {
        icon: "car",
        title: "",
        tagline: "",
        description: "",
        perks: [""],
        cta_text: "Book Now",
        display_order: doc.service_items.length,
      },
    ]);
  };

  const removeItem = (index) => {
    update(
      "service_items",
      doc.service_items.filter((_, i) => i !== index),
    );
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const payload = {
        key: PAGE_KEY,
        title: doc.title?.trim(),
        content: doc.content?.trim() || "",
        seo_title: doc.seo_title?.trim() ? doc.seo_title.trim() : null,
        seo_description: doc.seo_description?.trim() ? doc.seo_description.trim() : null,
        is_published: !!doc.is_published,
        hero_eyebrow: doc.hero_eyebrow?.trim() ? doc.hero_eyebrow.trim() : null,
        service_items: doc.service_items.map((item, i) => ({
          icon: item.icon || "car",
          title: item.title.trim(),
          tagline: item.tagline.trim(),
          description: item.description.trim(),
          perks: item.perks.map((p) => String(p).trim()).filter(Boolean),
          cta_text: item.cta_text?.trim() || "Book Now",
          display_order: Number(item.display_order ?? i),
        })),
        perfect_for_eyebrow: doc.perfect_for_eyebrow?.trim() ? doc.perfect_for_eyebrow.trim() : null,
        perfect_for_title: doc.perfect_for_title?.trim() ? doc.perfect_for_title.trim() : null,
        perfect_for_items: doc.perfect_for_items.map((p) => String(p).trim()).filter(Boolean),
        bottom_cta_title: doc.bottom_cta_title?.trim() ? doc.bottom_cta_title.trim() : null,
        bottom_cta_description: doc.bottom_cta_description?.trim() ? doc.bottom_cta_description.trim() : null,
        bottom_cta_button: doc.bottom_cta_button?.trim() ? doc.bottom_cta_button.trim() : null,
      };
      if (doc.id) {
        await api.put(`/cms_pages/${doc.id}`, payload);
        toast.success("Services page saved");
      } else {
        const { data } = await api.post("/cms_pages", payload);
        setDoc({ ...doc, id: data.id });
        toast.success("Services page created");
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
  const canSave = doc.title?.trim() && doc.service_items.some((s) => s.title.trim());

  return (
    <div data-testid="service-cms-page">
      <PageHeader
        title="Services page"
        description="Edit every section of the public /services page — hero, service cards, audience tags, and bottom CTA."
      />
      <p className="-mt-2 mb-4 max-w-3xl text-xs text-neutral-500 font-mono break-all">{publicUrl}</p>

      <div className="space-y-6 max-w-4xl">
        <SectionCard title="Hero section" subtitle="Top banner on /services">
          <Field label="Eyebrow label" value={doc.hero_eyebrow} onChange={(v) => update("hero_eyebrow", v)} />
          <Field label="Headline (H1)" hint="Use Enter for a line break." value={doc.title} onChange={(v) => update("title", v)} multiline />
          <TextAreaField label="Intro paragraph" value={doc.content} onChange={(v) => update("content", v)} rows={4} />
        </SectionCard>

        <SectionCard title="Service cards" subtitle="Each row on the customer services page">
          <div className="space-y-6">
            {doc.service_items.map((item, i) => (
              <div key={i} className="rounded-sm border border-neutral-200 p-4 space-y-4 bg-neutral-50/50">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <p className="font-display font-bold text-sm">
                    Service {i + 1}
                    {item.title ? `: ${item.title}` : ""}
                  </p>
                  {doc.service_items.length > 1 ? (
                    <button type="button" onClick={() => removeItem(i)} className="text-xs text-neutral-500 hover:text-[#E60000] flex items-center gap-1">
                      <Trash size={14} /> Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Icon</label>
                    <select
                      value={item.icon}
                      onChange={(e) => updateItem(i, "icon", e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-sm"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Display order" value={String(item.display_order ?? i)} onChange={(v) => updateItem(i, "display_order", Number(v) || 0)} />
                  <Field label="Title" value={item.title} onChange={(v) => updateItem(i, "title", v)} />
                  <Field label="Tagline" value={item.tagline} onChange={(v) => updateItem(i, "tagline", v)} />
                </div>
                <TextAreaField label="Description" value={item.description} onChange={(v) => updateItem(i, "description", v)} rows={4} />
                <TextAreaField
                  label="What's included (one perk per line)"
                  value={item.perks.join("\n")}
                  onChange={(v) => updateItemPerks(i, v)}
                  rows={6}
                />
                <Field label="Button text" value={item.cta_text} onChange={(v) => updateItem(i, "cta_text", v)} />
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline flex items-center gap-1">
              <Plus size={14} /> Add service
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Who we serve" subtitle="Tag cloud section">
          <Field label="Eyebrow" value={doc.perfect_for_eyebrow} onChange={(v) => update("perfect_for_eyebrow", v)} />
          <Field label="Section title" value={doc.perfect_for_title} onChange={(v) => update("perfect_for_title", v)} />
          <TextAreaField
            label="Tags (one per line)"
            value={doc.perfect_for_items.join("\n")}
            onChange={(v) => update("perfect_for_items", v.split("\n"))}
            rows={8}
          />
        </SectionCard>

        <SectionCard title="Bottom call-to-action" subtitle="Final section before footer">
          <Field label="Headline" value={doc.bottom_cta_title} onChange={(v) => update("bottom_cta_title", v)} />
          <TextAreaField label="Description" value={doc.bottom_cta_description} onChange={(v) => update("bottom_cta_description", v)} rows={3} />
          <Field label="Button text" value={doc.bottom_cta_button} onChange={(v) => update("bottom_cta_button", v)} />
        </SectionCard>

        <SectionCard title="SEO &amp; publish">
          <Field label="SEO title" value={doc.seo_title} onChange={(v) => update("seo_title", v)} />
          <TextAreaField label="SEO description" value={doc.seo_description} onChange={(v) => update("seo_description", v)} rows={3} />
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input type="checkbox" checked={!!doc.is_published} onChange={(e) => update("is_published", e.target.checked)} />
            <span className="text-sm font-medium text-neutral-800">Published (visible on customer website)</span>
          </label>
        </SectionCard>
      </div>

      <div className="mt-6 flex justify-end max-w-4xl">
        <button
          type="button"
          onClick={save}
          disabled={saving || !canSave}
          className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
          data-testid="save-service-button"
        >
          {saving ? "Saving…" : "Save Services page"}
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

function Field({ label, value, onChange, hint, multiline = false }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      {hint ? <p className="text-xs text-neutral-500 mb-1.5">{hint}</p> : null}
      {multiline ? (
        <textarea
          rows={2}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[3rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        />
      )}
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[4.5rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
      />
    </div>
  );
}
