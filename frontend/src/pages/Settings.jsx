import { useEffect, useState } from "react";
import api, { API_BASE } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { currencyFieldSuffix } from "@/lib/formatMoney";

function logoPreviewUrl(logoUrl) {
  if (!logoUrl?.trim()) return null;
  const u = logoUrl.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  return `${API_BASE}/files/${u}?auth=${encodeURIComponent(token)}`;
}

export default function Settings() {
  const { refreshBranding } = useBranding();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) =>
      setSettings({
        ...data,
        currency: data.currency === "RWF" ? "RWF" : "USD",
      }),
    );
  }, []);

  const update = (k, v) => setSettings({ ...settings, [k]: v });

  const onLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads?folder=branding", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update("logo_url", data.path);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      delete payload.id;
      delete payload.updated_at;
      delete payload.smtp_configured;
      await api.put("/settings", payload);
      await refreshBranding();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { data } = await api.post("/settings/test-email", {
        to: settings.notification_email_to || settings.smtp_user || undefined,
      });
      toast.success(`Test email sent to ${data.sent_to}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Test email failed");
    } finally {
      setTestingEmail(false);
    }
  };

  if (!settings) return <div className="text-xs text-neutral-500 font-mono">Loading...</div>;

  const cur = settings.currency === "RWF" ? "RWF" : "USD";
  const suffix = currencyFieldSuffix(cur);

  return (
    <div data-testid="settings-page">
      <PageHeader title="Settings" description="Company branding, currency (USD default — also used on the public site), and rental policies." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Company Info">
          <Field label="Company Name" value={settings.company_name} onChange={(v) => update("company_name", v)} testId="setting-company-name" />

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Logo</label>
            <p className="text-xs text-neutral-500 mb-2">Upload PNG, JPEG, WebP, or GIF (max 10MB). Used on login and in the sidebar.</p>
            <div className="flex flex-wrap items-center gap-3">
              {logoPreviewUrl(settings.logo_url) ? (
                <img
                  src={logoPreviewUrl(settings.logo_url)}
                  alt=""
                  className="h-14 max-w-[200px] object-contain border border-neutral-200 bg-white rounded-sm"
                />
              ) : (
                <div className="h-14 w-24 border border-dashed border-neutral-300 bg-neutral-50 rounded-sm flex items-center justify-center text-[10px] text-neutral-400 uppercase">
                  No logo
                </div>
              )}
              <label className="inline-flex cursor-pointer">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onLogoUpload} disabled={uploadingLogo} data-testid="setting-logo-upload" />
                <span className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm">
                  {uploadingLogo ? "Uploading…" : "Upload logo"}
                </span>
              </label>
              {settings.logo_url ? (
                <button type="button" onClick={() => update("logo_url", "")} className="text-xs text-neutral-600 underline uppercase tracking-wider">
                  Remove logo
                </button>
              ) : null}
            </div>
          </div>

          <Field
            label="Logo URL (optional)"
            value={settings.logo_url || ""}
            onChange={(v) => update("logo_url", v)}
            testId="setting-logo-url"
            hint="Paste a hosted image URL, or upload above to store on the server."
          />

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Currency</label>
            <p className="text-xs text-neutral-500 mb-2">Used for all prices in admin and on the marketing site. Default is USD.</p>
            <select
              value={cur}
              onChange={(e) => update("currency", e.target.value)}
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
              data-testid="setting-currency"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="RWF">RWF — Rwandan Franc</option>
            </select>
          </div>

          <Field label="Timezone" value={settings.timezone} onChange={(v) => update("timezone", v)} testId="setting-timezone" />
          <Field label="Language" value={settings.language} onChange={(v) => update("language", v)} testId="setting-language" />
        </Section>

        <Section title="Rental Policies">
          <Field label="Deposit Rule" value={settings.deposit_rule} onChange={(v) => update("deposit_rule", v)} testId="setting-deposit" />
          <Field
            label={`Late Return Charge / hr ${suffix}`}
            type="number"
            value={settings.late_return_charge_per_hour}
            onChange={(v) => update("late_return_charge_per_hour", Number(v))}
            testId="setting-late-charge"
          />
          <Field label="Fuel Policy" value={settings.fuel_policy} onChange={(v) => update("fuel_policy", v)} testId="setting-fuel" />
        </Section>

        <Section title="Contact & address (public site)">
          <p className="text-xs text-neutral-500 -mt-1">
            Shown in the marketing site footer and contact blocks. Saved with other settings.
          </p>
          <Field label="Public phone" value={settings.company_phone || ""} onChange={(v) => update("company_phone", v)} testId="setting-company-phone" hint="E.g. +1 555 123 4567" />
          <Field label="Public email" value={settings.company_email || ""} onChange={(v) => update("company_email", v)} testId="setting-company-email" />
          <Field label="Website URL" value={settings.website_url || ""} onChange={(v) => update("website_url", v)} testId="setting-website-url" hint="https://… or domain only" />
          <Field label="Address line 1" value={settings.address_line1 || ""} onChange={(v) => update("address_line1", v)} testId="setting-address1" />
          <Field label="Address line 2" value={settings.address_line2 || ""} onChange={(v) => update("address_line2", v)} testId="setting-address2" />
          <Field label="City" value={settings.city || ""} onChange={(v) => update("city", v)} testId="setting-city" />
          <Field label="State / region" value={settings.state_region || ""} onChange={(v) => update("state_region", v)} testId="setting-region" />
          <Field label="Postal code" value={settings.postal_code || ""} onChange={(v) => update("postal_code", v)} testId="setting-postal" />
          <Field label="Country" value={settings.country || ""} onChange={(v) => update("country", v)} testId="setting-country" />
        </Section>

        <Section title="Marketing footer (CanvasTours)">
          <p className="text-xs text-neutral-500 -mt-1">
            Tagline, description, hours, social links (WhatsApp, Facebook, TikTok, Instagram), and copyright line below the footer grid.
          </p>
          <Field label="Footer tagline (script line under logo)" value={settings.footer_tagline || ""} onChange={(v) => update("footer_tagline", v)} testId="setting-footer-tagline" />
          <TextAreaField label="Footer description (main blurb)" value={settings.footer_description || ""} onChange={(v) => update("footer_description", v)} testId="setting-footer-desc" rows={4} />
          <TextAreaField label="Business hours (one or more lines)" value={settings.business_hours_text || ""} onChange={(v) => update("business_hours_text", v)} testId="setting-business-hours" rows={3} />
          <Field label="Footer credit line (bottom bar, right side)" value={settings.footer_credit_line || ""} onChange={(v) => update("footer_credit_line", v)} testId="setting-footer-credit" hint="Leave empty to use a short default line." />
          <Field label="WhatsApp URL" value={settings.social_whatsapp_url || ""} onChange={(v) => update("social_whatsapp_url", v)} testId="setting-social-wa" hint="e.g. https://wa.me/15551234567" />
          <Field label="Facebook URL" value={settings.social_facebook_url || ""} onChange={(v) => update("social_facebook_url", v)} testId="setting-social-fb" />
          <Field label="TikTok URL" value={settings.social_tiktok_url || ""} onChange={(v) => update("social_tiktok_url", v)} testId="setting-social-tiktok" hint="e.g. https://www.tiktok.com/@yourbrand" />
          <Field label="Instagram URL" value={settings.social_instagram_url || ""} onChange={(v) => update("social_instagram_url", v)} testId="setting-social-ig" />
        </Section>

        <Section title="Site SEO (marketing site)">
          <p className="text-xs text-neutral-500 -mt-1">
            Controls the public site <code className="text-[11px] bg-neutral-100 px-1">index.html</code> head tags
            (title, description, Open Graph, Twitter). Fetched via{" "}
            <code className="text-[11px] bg-neutral-100 px-1">GET /api/branding</code> →{" "}
            <code className="text-[11px] bg-neutral-100 px-1">seo</code>.
          </p>
          <Field
            label="Site title"
            value={settings.site_seo_title || ""}
            onChange={(v) => update("site_seo_title", v)}
            testId="setting-site-seo-title"
            hint="Browser tab, og:title, twitter:title. Leave empty to use Company Name."
          />
          <TextAreaField
            label="Meta description"
            value={settings.site_meta_description || ""}
            onChange={(v) => update("site_meta_description", v)}
            testId="setting-site-meta-desc"
            rows={3}
            hint="Shown in search results and social previews. Falls back to company description if empty."
          />
          <Field
            label="Robots"
            value={settings.site_robots || "index, follow"}
            onChange={(v) => update("site_robots", v)}
            testId="setting-site-robots"
            hint='Usually "index, follow". Use "noindex, nofollow" to hide from search engines.'
          />
          <Field
            label="Open Graph / Twitter image URL"
            value={settings.og_image_url || ""}
            onChange={(v) => update("og_image_url", v)}
            testId="setting-og-image"
            hint="Absolute URL, /opengraph.jpg, or upload logo and paste its path. Recommended 1200×630."
          />
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">
              Twitter card type
            </label>
            <select
              value={settings.twitter_card || "summary_large_image"}
              onChange={(e) => update("twitter_card", e.target.value)}
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
              data-testid="setting-twitter-card"
            >
              <option value="summary_large_image">summary_large_image (recommended)</option>
              <option value="summary">summary</option>
            </select>
          </div>
        </Section>

        <Section title="Integrations">
          <p className="text-xs text-neutral-500">
            Outgoing mail uses your domain SMTP (e.g. novacarrentals.com on port 465 SSL). Set{" "}
            <code className="font-mono text-[11px]">SMTP_PASSWORD</code> in backend <code className="font-mono text-[11px]">.env</code> — not in this form.
            Upload a logo under Company Info and set <strong>Website URL</strong> so it appears in email headers.
          </p>
          <Field label="SMTP Host" value={settings.smtp_host || ""} onChange={(v) => update("smtp_host", v)} testId="setting-smtp-host" hint="Mail server hostname (not the cPanel URL)." />
          <Field label="SMTP Port" type="number" value={settings.smtp_port ?? 465} onChange={(v) => update("smtp_port", v)} testId="setting-smtp-port" hint="465 for SSL/TLS (Namecheap/cPanel)." />
          <Field label="SMTP User" value={settings.smtp_user || ""} onChange={(v) => update("smtp_user", v)} testId="setting-smtp-user" />
          <Field label="From email" value={settings.smtp_from_email || ""} onChange={(v) => update("smtp_from_email", v)} testId="setting-smtp-from" />
          <Field label="Notification email to" value={settings.notification_email_to || ""} onChange={(v) => update("notification_email_to", v)} testId="setting-notify-email" hint="Admin inbox for contact forms, bookings, and in-app alerts." />
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtp_use_ssl !== false}
                onChange={(e) => update("smtp_use_ssl", e.target.checked)}
                className="rounded border-neutral-300"
                data-testid="setting-smtp-ssl"
              />
              Use SSL (port 465)
            </label>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${settings.smtp_configured ? "text-emerald-600" : "text-amber-600"}`}>
              {settings.smtp_configured ? "SMTP ready" : "Password required in .env"}
            </span>
          </div>
          <button
            type="button"
            onClick={sendTestEmail}
            disabled={testingEmail}
            className="border border-neutral-300 hover:border-[#E60000] px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
            data-testid="send-test-email-button"
          >
            {testingEmail ? "Sending..." : "Send test email"}
          </button>
          <Field label="Payment Gateway" value={settings.payment_gateway} onChange={(v) => update("payment_gateway", v)} testId="setting-gateway" />
          <Field label="SMS Provider" value={settings.sms_provider} onChange={(v) => update("sms_provider", v)} testId="setting-sms" />
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm"
          data-testid="save-settings-button"
        >
          {saving ? "Saving..." : "Save Settings"}
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

function Field({ label, value, onChange, type = "text", testId, hint }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
      {hint ? <p className="text-xs text-neutral-500 mb-1.5">{hint}</p> : null}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        data-testid={testId}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, testId, hint, rows = 4 }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}</label>
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
