import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { Link } from "react-router-dom";

export default function CompanyProfile() {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setSettings(data));
  }, []);

  const update = (k, v) => setSettings({ ...settings, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      delete payload.id;
      delete payload.updated_at;
      await api.put("/settings", payload);
      await refreshBranding();
      toast.success("Company profile saved");
    } catch {
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="text-xs text-neutral-500 font-mono">Loading...</div>;

  return (
    <div data-testid="company-profile-page">
      <PageHeader
        title="Company profile"
        description="Public contact details, company description, and address for the website and GET /api/branding."
      />
      <p className="-mt-2 mb-6 max-w-2xl text-xs text-neutral-500">
        For logo, currency, and SMTP:{" "}
        <Link to="/settings" className="font-semibold text-[#E60000] underline-offset-2 hover:underline">
          Settings
        </Link>
        .
      </p>

      <div className="mb-4">
        <Section title="About the company">
          <p className="text-xs text-neutral-500 -mt-1 mb-1">
            Short overview of your business. Exposed publicly as{" "}
            <code className="text-[11px] bg-neutral-100 px-1">company.description</code> on{" "}
            <code className="text-[11px] bg-neutral-100 px-1">GET /api/branding</code> for marketing sites.
          </p>
          <TextAreaField
            label="Company description"
            value={settings.company_description || ""}
            onChange={(v) => update("company_description", v)}
            testId="company-description"
            rows={6}
            placeholder="Who you are, what you offer, and what makes your rental service stand out."
          />
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Contact">
          <Field label="Company phone" value={settings.company_phone} onChange={(v) => update("company_phone", v)} testId="company-phone" />
          <Field label="Company email" value={settings.company_email} onChange={(v) => update("company_email", v)} type="email" testId="company-email" />
          <Field label="Website URL" value={settings.website_url || ""} onChange={(v) => update("website_url", v)} testId="company-website" />
        </Section>
        <Section title="Address">
          <Field label="Address line 1" value={settings.address_line1 || ""} onChange={(v) => update("address_line1", v)} testId="company-address1" />
          <Field label="Address line 2" value={settings.address_line2 || ""} onChange={(v) => update("address_line2", v)} testId="company-address2" />
          <Field label="City" value={settings.city || ""} onChange={(v) => update("city", v)} testId="company-city" />
          <Field label="State / region" value={settings.state_region || ""} onChange={(v) => update("state_region", v)} testId="company-state" />
          <Field label="Postal code" value={settings.postal_code || ""} onChange={(v) => update("postal_code", v)} testId="company-postal" />
          <Field label="Country" value={settings.country || ""} onChange={(v) => update("country", v)} testId="company-country" />
        </Section>
      </div>

      <div className="mt-4">
        <Section title="Social media (public site)">
          <p className="text-xs text-neutral-500 -mt-1 mb-1">
            Profile URLs for WhatsApp, Facebook, TikTok, and Instagram. Saved here and exposed on{" "}
            <code className="text-[11px] bg-neutral-100 px-1">GET /api/branding</code>{" "}
            (<code className="text-[11px] bg-neutral-100 px-1">social_links</code>) for the marketing site footer and admin header.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="WhatsApp (chat link)" value={settings.social_whatsapp_url || ""} onChange={(v) => update("social_whatsapp_url", v)} testId="company-social-wa" placeholder="https://wa.me/15551234567" />
            <Field label="Facebook" value={settings.social_facebook_url || ""} onChange={(v) => update("social_facebook_url", v)} testId="company-social-fb" placeholder="https://facebook.com/…" />
            <Field
              label="TikTok"
              value={settings.social_tiktok_url || ""}
              onChange={(v) => update("social_tiktok_url", v)}
              testId="company-social-tiktok"
              placeholder="https://www.tiktok.com/@yourbrand"
              hint="Profile or channel URL, e.g. https://www.tiktok.com/@handle"
            />
            <Field label="Instagram" value={settings.social_instagram_url || ""} onChange={(v) => update("social_instagram_url", v)} testId="company-social-ig" placeholder="https://instagram.com/…" />
          </div>
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
          data-testid="save-company-profile-button"
        >
          {saving ? "Saving..." : "Save company profile"}
        </button>
      </div>

    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="sharp-card p-5 space-y-4">
      <div className="font-display font-bold text-lg tracking-tight border-b border-neutral-200 pb-3">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testId, placeholder, hint }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        data-testid={testId}
      />
      {hint ? <p className="mt-1.5 text-[11px] text-neutral-500 leading-snug">{hint}</p> : null}
    </div>
  );
}

function TextAreaField({ label, value, onChange, testId, placeholder, rows = 4 }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      <textarea
        value={value ?? ""}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[6rem] bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm resize-y"
        data-testid={testId}
      />
    </div>
  );
}
