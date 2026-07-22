import { useEffect, useState } from "react";
import api, { API_BASE, formatAxiosError, fileImageSrcFromStored } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Plus, Trash } from "@phosphor-icons/react";

const DEST_KEY = "destinations";

const ICON_OPTIONS = [
  { value: "mountain", label: "Mountain (Rwanda)" },
  { value: "trees", label: "Trees (Uganda)" },
  { value: "waves", label: "Waves (Tanzania / coast)" },
];

const IMG_BG_PRESETS = [
  "bg-gradient-to-br from-green-900/30 to-background",
  "bg-gradient-to-br from-emerald-900/30 to-background",
  "bg-gradient-to-br from-amber-900/30 to-background",
  "bg-gradient-to-br from-blue-900/30 to-background",
];

const DEFAULT_COUNTRIES = [
  {
    name: "Rwanda",
    tagline: "The Land of a Thousand Hills",
    description:
      "From the vibrant capital Kigali to the misty volcanic slopes of the north and the shores of Lake Kivu, Rwanda is a nation of extraordinary beauty and remarkable accessibility.",
    icon: "mountain",
    cities: ["Kigali", "Musanze", "Rubavu", "Huye", "Rusizi", "Nyagatare"],
    parks: [
      { name: "Volcanoes National Park", highlight: "Gorilla Trekking" },
      { name: "Akagera National Park", highlight: "Big Five Safari" },
      { name: "Nyungwe National Park", highlight: "Chimpanzees & Canopy Walk" },
      { name: "Lake Kivu", highlight: "Scenic Lakeside Drive" },
    ],
    img_bg: IMG_BG_PRESETS[0],
    cover_image: "",
    display_order: 0,
  },
  {
    name: "Uganda",
    tagline: "The Pearl of Africa",
    description:
      "Uganda's extraordinary biodiversity makes it one of Africa's premier wildlife destinations. Trek with mountain gorillas in Bwindi, cruise down the Nile from Jinja, or witness Murchison Falls.",
    icon: "trees",
    cities: ["Kampala", "Entebbe", "Jinja", "Mbarara", "Kabale"],
    parks: [
      { name: "Bwindi Impenetrable Forest", highlight: "Mountain Gorillas" },
      { name: "Queen Elizabeth National Park", highlight: "Tree-climbing Lions" },
      { name: "Murchison Falls National Park", highlight: "Murchison Falls" },
      { name: "Kibale National Park", highlight: "Chimpanzee Trekking" },
    ],
    img_bg: IMG_BG_PRESETS[1],
    cover_image: "",
    display_order: 1,
  },
  {
    name: "Tanzania",
    tagline: "Africa's Untamed Frontier",
    description:
      "Tanzania is home to Serengeti, Kilimanjaro, the Ngorongoro Crater, and Zanzibar's white-sand shores. Our vehicles give you access from Dar es Salaam to the remotest corners of the savanna.",
    icon: "waves",
    cities: ["Dar es Salaam", "Arusha", "Moshi", "Mwanza", "Dodoma", "Zanzibar"],
    parks: [
      { name: "Serengeti National Park", highlight: "Great Migration" },
      { name: "Ngorongoro Conservation Area", highlight: "Crater Safari" },
      { name: "Tarangire National Park", highlight: "Elephant Herds" },
      { name: "Mount Kilimanjaro", highlight: "Africa's Highest Peak" },
    ],
    img_bg: IMG_BG_PRESETS[2],
    cover_image: "",
    display_order: 2,
  },
];

const DEFAULT_AIRPORTS = [
  { city: "Kigali", country: "Rwanda", code: "KGL", airport: "Kigali International Airport" },
  { city: "Entebbe", country: "Uganda", code: "EBB", airport: "Entebbe International Airport" },
  { city: "Dar es Salaam", country: "Tanzania", code: "DAR", airport: "Julius Nyerere International Airport" },
  { city: "Arusha", country: "Tanzania", code: "ARK", airport: "Arusha Airport" },
  { city: "Zanzibar", country: "Tanzania", code: "ZNZ", airport: "Abeid Amani Karume International" },
  { city: "Mwanza", country: "Tanzania", code: "MWZ", airport: "Mwanza Airport" },
];

const emptyDoc = {
  key: DEST_KEY,
  title: "One Fleet.\nThree Countries.",
  content:
    "NOVACAR RENTALS operates across Rwanda, Uganda, and Tanzania — giving you the freedom to cross borders, follow the migration, climb the volcano, or simply explore at your own pace.",
  seo_title: "Destinations",
  seo_description: "Explore Rwanda, Uganda, and Tanzania with a vehicle matched to every road.",
  is_published: true,
  hero_eyebrow: "Destinations",
  destination_countries: DEFAULT_COUNTRIES.map((c) => ({
    ...c,
    cities: [...c.cities],
    parks: c.parks.map((p) => ({ ...p })),
  })),
  airports_eyebrow: "Airport Coverage",
  airports_title: "We Cover Every Major Airport",
  airports_intro:
    "Our drivers monitor your flight in real time. We'll be there, whether you land on schedule or not.",
  destination_airports: DEFAULT_AIRPORTS.map((a) => ({ ...a })),
  cross_border_eyebrow: "Cross-Border Travel",
  cross_border_title: "Seamless Border Crossings",
  cross_border_description:
    "All required documentation, cross-border permits, and insurance are handled by our team. You focus on the journey — we handle the paperwork.",
  cross_border_button: "Plan Your Multi-Country Trip",
};

function normalizeCountry(row, index) {
  const fallback = DEFAULT_COUNTRIES[index] || DEFAULT_COUNTRIES[0];
  const parksRaw = Array.isArray(row?.parks) && row.parks.length ? row.parks : fallback.parks;
  const citiesRaw = Array.isArray(row?.cities) && row.cities.length ? row.cities : fallback.cities;
  return {
    name: String(row?.name ?? fallback.name),
    tagline: String(row?.tagline ?? fallback.tagline),
    description: String(row?.description ?? fallback.description),
    icon: String(row?.icon ?? fallback.icon),
    cities: citiesRaw.map((c) => String(c ?? "").trim()).filter(Boolean),
    parks: parksRaw.map((p) => ({
      name: String(p?.name ?? ""),
      highlight: String(p?.highlight ?? ""),
    })),
    img_bg: String(row?.img_bg ?? fallback.img_bg),
    cover_image: String(row?.cover_image ?? ""),
    display_order: Number(row?.display_order ?? index),
  };
}

function normalizeCountries(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((row, i) => normalizeCountry(row, i));
  }
  return emptyDoc.destination_countries.map((c) => ({ ...c, cities: [...c.cities], parks: c.parks.map((p) => ({ ...p })) }));
}

function normalizeAirports(raw) {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((a) => ({
      city: String(a?.city ?? ""),
      country: String(a?.country ?? ""),
      code: String(a?.code ?? ""),
      airport: String(a?.airport ?? ""),
    }));
  }
  return DEFAULT_AIRPORTS.map((a) => ({ ...a }));
}

function docFromApi(found) {
  return {
    id: found.id,
    key: found.key || DEST_KEY,
    title: found.title ?? emptyDoc.title,
    content: found.content ?? emptyDoc.content,
    seo_title: found.seo_title ?? "",
    seo_description: found.seo_description ?? "",
    is_published: !!found.is_published,
    hero_eyebrow: found.hero_eyebrow ?? emptyDoc.hero_eyebrow,
    destination_countries: normalizeCountries(found.destination_countries),
    airports_eyebrow: found.airports_eyebrow ?? emptyDoc.airports_eyebrow,
    airports_title: found.airports_title ?? emptyDoc.airports_title,
    airports_intro: found.airports_intro ?? emptyDoc.airports_intro,
    destination_airports: normalizeAirports(found.destination_airports),
    cross_border_eyebrow: found.cross_border_eyebrow ?? emptyDoc.cross_border_eyebrow,
    cross_border_title: found.cross_border_title ?? emptyDoc.cross_border_title,
    cross_border_description: found.cross_border_description ?? emptyDoc.cross_border_description,
    cross_border_button: found.cross_border_button ?? emptyDoc.cross_border_button,
  };
}

export default function DestinationsPage() {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/cms_pages");
        const rows = Array.isArray(data) ? data : [];
        const found = rows.find((p) => String(p.key || "").toLowerCase() === DEST_KEY);
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

  const updateCountry = (index, field, value) => {
    const countries = [...doc.destination_countries];
    countries[index] = { ...countries[index], [field]: value };
    update("destination_countries", countries);
  };

  const updateCountryCities = (index, text) => {
    updateCountry(
      index,
      "cities",
      text.split("\n").map((l) => l.trim()).filter(Boolean),
    );
  };

  const updatePark = (countryIndex, parkIndex, field, value) => {
    const countries = [...doc.destination_countries];
    const parks = [...countries[countryIndex].parks];
    parks[parkIndex] = { ...parks[parkIndex], [field]: value };
    countries[countryIndex] = { ...countries[countryIndex], parks };
    update("destination_countries", countries);
  };

  const addPark = (countryIndex) => {
    const countries = [...doc.destination_countries];
    countries[countryIndex] = {
      ...countries[countryIndex],
      parks: [...countries[countryIndex].parks, { name: "", highlight: "" }],
    };
    update("destination_countries", countries);
  };

  const removePark = (countryIndex, parkIndex) => {
    const countries = [...doc.destination_countries];
    countries[countryIndex] = {
      ...countries[countryIndex],
      parks: countries[countryIndex].parks.filter((_, i) => i !== parkIndex),
    };
    update("destination_countries", countries);
  };

  const addCountry = () => {
    update("destination_countries", [
      ...doc.destination_countries,
      {
        name: "",
        tagline: "",
        description: "",
        icon: "mountain",
        cities: [],
        parks: [{ name: "", highlight: "" }],
        img_bg: IMG_BG_PRESETS[0],
        cover_image: "",
        display_order: doc.destination_countries.length,
      },
    ]);
  };

  const removeCountry = (index) => {
    update(
      "destination_countries",
      doc.destination_countries.filter((_, i) => i !== index),
    );
  };

  const updateAirport = (index, field, value) => {
    const airports = [...doc.destination_airports];
    airports[index] = { ...airports[index], [field]: value };
    update("destination_airports", airports);
  };

  const addAirport = () => {
    update("destination_airports", [...doc.destination_airports, { city: "", country: "", code: "", airport: "" }]);
  };

  const removeAirport = (index) => {
    update(
      "destination_airports",
      doc.destination_airports.filter((_, i) => i !== index),
    );
  };

  const uploadCover = async (countryIndex, file) => {
    if (!file) return;
    const key = `country-${countryIndex}`;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads?folder=cms/destinations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateCountry(countryIndex, "cover_image", data.path);
      toast.success("Cover image uploaded");
    } catch (e) {
      toast.error(formatAxiosError(e));
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const payload = {
        key: DEST_KEY,
        title: doc.title?.trim(),
        content: doc.content?.trim() || "",
        seo_title: doc.seo_title?.trim() ? doc.seo_title.trim() : null,
        seo_description: doc.seo_description?.trim() ? doc.seo_description.trim() : null,
        is_published: !!doc.is_published,
        hero_eyebrow: doc.hero_eyebrow?.trim() ? doc.hero_eyebrow.trim() : null,
        destination_countries: doc.destination_countries.map((c, i) => ({
          name: c.name.trim(),
          tagline: c.tagline.trim(),
          description: c.description.trim(),
          icon: c.icon || "mountain",
          cities: c.cities.map((city) => String(city).trim()).filter(Boolean),
          parks: c.parks
            .map((p) => ({ name: p.name.trim(), highlight: p.highlight.trim() }))
            .filter((p) => p.name || p.highlight),
          img_bg: c.img_bg?.trim() || IMG_BG_PRESETS[0],
          cover_image: c.cover_image?.trim() ? c.cover_image.trim() : null,
          display_order: Number(c.display_order ?? i),
        })),
        airports_eyebrow: doc.airports_eyebrow?.trim() ? doc.airports_eyebrow.trim() : null,
        airports_title: doc.airports_title?.trim() ? doc.airports_title.trim() : null,
        airports_intro: doc.airports_intro?.trim() ? doc.airports_intro.trim() : null,
        destination_airports: doc.destination_airports
          .map((a) => ({
            city: a.city.trim(),
            country: a.country.trim(),
            code: a.code.trim().toUpperCase(),
            airport: a.airport.trim(),
          }))
          .filter((a) => a.city || a.code),
        cross_border_eyebrow: doc.cross_border_eyebrow?.trim() ? doc.cross_border_eyebrow.trim() : null,
        cross_border_title: doc.cross_border_title?.trim() ? doc.cross_border_title.trim() : null,
        cross_border_description: doc.cross_border_description?.trim() ? doc.cross_border_description.trim() : null,
        cross_border_button: doc.cross_border_button?.trim() ? doc.cross_border_button.trim() : null,
      };
      if (doc.id) {
        await api.put(`/cms_pages/${doc.id}`, payload);
        toast.success("Destinations page saved");
      } else {
        const { data } = await api.post("/cms_pages", payload);
        setDoc({ ...doc, id: data.id });
        toast.success("Destinations page created");
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

  const publicUrl = `${API_BASE}/public/cms-page/${DEST_KEY}`;
  const canSave = doc.title?.trim() && doc.destination_countries.some((c) => c.name.trim());

  return (
    <div data-testid="destinations-page">
      <PageHeader
        title="Destinations page"
        description="Edit every section of the public /destinations page — countries, cities, parks, airports, and cross-border CTA."
      />
      <p className="-mt-2 mb-4 max-w-3xl text-xs text-neutral-500 font-mono break-all">{publicUrl}</p>

      <div className="space-y-6 max-w-4xl">
        <SectionCard title="Hero section" subtitle="Top banner on /destinations">
          <Field label="Eyebrow label" value={doc.hero_eyebrow} onChange={(v) => update("hero_eyebrow", v)} />
          <Field
            label="Headline (H1)"
            hint="Use Enter for a line break."
            value={doc.title}
            onChange={(v) => update("title", v)}
            multiline
          />
          <TextAreaField
            label="Intro paragraph"
            value={doc.content}
            onChange={(v) => update("content", v)}
            rows={4}
          />
        </SectionCard>

        <SectionCard title="Countries" subtitle="Rwanda, Uganda, Tanzania — add or reorder">
          <div className="space-y-6">
            {doc.destination_countries.map((country, ci) => (
              <div key={ci} className="rounded-sm border border-neutral-200 p-4 space-y-4 bg-neutral-50/50">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <p className="font-display font-bold text-sm">
                    Country {ci + 1}
                    {country.name ? `: ${country.name}` : ""}
                  </p>
                  {doc.destination_countries.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeCountry(ci)}
                      className="text-xs text-neutral-500 hover:text-[#E60000] flex items-center gap-1"
                    >
                      <Trash size={14} /> Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Country name" value={country.name} onChange={(v) => updateCountry(ci, "name", v)} />
                  <Field label="Tagline" value={country.tagline} onChange={(v) => updateCountry(ci, "tagline", v)} />
                  <Field
                    label="Display order"
                    value={String(country.display_order ?? ci)}
                    onChange={(v) => updateCountry(ci, "display_order", Number(v) || 0)}
                  />
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
                      Icon
                    </label>
                    <select
                      value={country.icon}
                      onChange={(e) => updateCountry(ci, "icon", e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-sm"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <TextAreaField
                  label="Description"
                  value={country.description}
                  onChange={(v) => updateCountry(ci, "description", v)}
                  rows={4}
                />
                <TextAreaField
                  label="Cities we serve (one per line)"
                  value={country.cities.join("\n")}
                  onChange={(v) => updateCountryCities(ci, v)}
                  rows={5}
                />
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-2">
                    Parks &amp; natural wonders
                  </label>
                  <div className="space-y-3">
                    {country.parks.map((park, pi) => (
                      <div key={pi} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                        <Field
                          label={pi === 0 ? "Park name" : ""}
                          value={park.name}
                          onChange={(v) => updatePark(ci, pi, "name", v)}
                        />
                        <Field
                          label={pi === 0 ? "Highlight" : ""}
                          value={park.highlight}
                          onChange={(v) => updatePark(ci, pi, "highlight", v)}
                        />
                        <button
                          type="button"
                          onClick={() => removePark(ci, pi)}
                          className="pb-2 text-neutral-400 hover:text-[#E60000]"
                          title="Remove park"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addPark(ci)}
                      className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Add park
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
                    Panel background (Tailwind classes)
                  </label>
                  <select
                    value={country.img_bg}
                    onChange={(e) => updateCountry(ci, "img_bg", e.target.value)}
                    className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm rounded-sm mb-2"
                  >
                    {IMG_BG_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <CoverImageField
                  label="Optional cover photo (left panel background)"
                  value={country.cover_image}
                  onChange={(v) => updateCountry(ci, "cover_image", v)}
                  onUpload={(file) => uploadCover(ci, file)}
                  uploading={uploadingKey === `country-${ci}`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addCountry}
              className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add country
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Airport coverage" subtitle="Grid of airports below the countries">
          <Field label="Eyebrow" value={doc.airports_eyebrow} onChange={(v) => update("airports_eyebrow", v)} />
          <Field label="Section title" value={doc.airports_title} onChange={(v) => update("airports_title", v)} />
          <TextAreaField
            label="Section intro"
            value={doc.airports_intro}
            onChange={(v) => update("airports_intro", v)}
            rows={3}
          />
          <div className="space-y-3 pt-2">
            {doc.destination_airports.map((ap, i) => (
              <div key={i} className="grid sm:grid-cols-4 gap-2 items-end border border-neutral-200 p-3 bg-white">
                <Field label="City" value={ap.city} onChange={(v) => updateAirport(i, "city", v)} />
                <Field label="Country" value={ap.country} onChange={(v) => updateAirport(i, "country", v)} />
                <Field label="Code" value={ap.code} onChange={(v) => updateAirport(i, "code", v)} />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Field label="Airport name" value={ap.airport} onChange={(v) => updateAirport(i, "airport", v)} />
                  </div>
                  <button type="button" onClick={() => removeAirport(i)} className="pb-2 text-neutral-400 hover:text-[#E60000]">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAirport}
              className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add airport
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Cross-border CTA" subtitle="Bottom call-to-action section">
          <Field label="Eyebrow" value={doc.cross_border_eyebrow} onChange={(v) => update("cross_border_eyebrow", v)} />
          <Field label="Headline" value={doc.cross_border_title} onChange={(v) => update("cross_border_title", v)} />
          <TextAreaField
            label="Description"
            value={doc.cross_border_description}
            onChange={(v) => update("cross_border_description", v)}
            rows={3}
          />
          <Field label="Button text" value={doc.cross_border_button} onChange={(v) => update("cross_border_button", v)} />
        </SectionCard>

        <SectionCard title="SEO &amp; publish">
          <Field label="SEO title" value={doc.seo_title} onChange={(v) => update("seo_title", v)} />
          <TextAreaField
            label="SEO description"
            value={doc.seo_description}
            onChange={(v) => update("seo_description", v)}
            rows={3}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={!!doc.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
            />
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
        >
          {saving ? "Saving…" : "Save Destinations page"}
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
      {label ? (
        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
          {label}
        </label>
      ) : null}
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
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[4.5rem] resize-y bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
      />
    </div>
  );
}

function CoverImageField({ label, value, onChange, onUpload, uploading }) {
  const previewSrc = value?.trim()
    ? value.startsWith("http")
      ? value
      : fileImageSrcFromStored(value)
    : "";

  return (
    <div className="rounded-sm border border-neutral-200 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</p>
      <div className="aspect-[16/9] max-w-sm bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
        {previewSrc ? (
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-400">No image</span>
        )}
      </div>
      <Field label="Image path" value={value} onChange={onChange} />
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#E60000] hover:underline">
          {uploading ? "Uploading…" : "Upload cover"}
        </span>
      </label>
    </div>
  );
}
