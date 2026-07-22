/**
 * Compact social icons for the admin header.
 * Shows WhatsApp, Facebook, TikTok, and Instagram only (matches public site).
 */
/** Tighter glyphs on narrow viewports; standard size from `sm` up. */
const ICON_CLASS =
  "h-2.5 w-2.5 shrink-0 text-neutral-600 group-hover:text-[#E60000] sm:h-4 sm:w-4";

function Svg({ children, title }) {
  return (
    <svg className={ICON_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function IconFacebook() {
  return (
    <Svg title="Facebook">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2v-2.2c0-1.97 1.16-3.05 2.96-3.05.86 0 1.76.15 1.76.15v2h-1.5c-1.2 0-1.58.75-1.58 1.52V12h3l-.48 3H14v6.8c4.56-.93 8-4.96 8-9.8z" />
    </Svg>
  );
}

function IconInstagram() {
  return (
    <Svg title="Instagram">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 .002 6.002A3 3 0 0 0 12 9z" />
    </Svg>
  );
}

function IconWhatsApp() {
  return (
    <Svg title="WhatsApp">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </Svg>
  );
}

function IconTikTok() {
  return (
    <Svg title="TikTok">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </Svg>
  );
}

const CONFIG = [
  { keys: ["whatsapp"], label: "WhatsApp", Icon: IconWhatsApp },
  { keys: ["facebook"], label: "Facebook", Icon: IconFacebook },
  { keys: ["tiktok"], label: "TikTok", Icon: IconTikTok },
  { keys: ["instagram"], label: "Instagram", Icon: IconInstagram },
];

export default function HeaderSocialLinks({ social }) {
  if (!social || typeof social !== "object") return null;

  const items = [];
  for (const row of CONFIG) {
    const href = row.keys.map((k) => social[k]).find(Boolean);
    if (!href) continue;
    items.push({ href: String(href).trim(), label: row.label, Icon: row.Icon });
  }

  if (!items.length) return null;

  return (
    <div
      className="flex max-w-[min(100%,10rem)] flex-wrap items-center justify-end gap-px sm:max-w-none sm:flex-nowrap sm:gap-1"
      data-testid="header-social-links"
      aria-label="Social links"
    >
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex h-6 min-h-[36px] w-6 min-w-[36px] items-center justify-center rounded-sm border border-transparent hover:border-neutral-200 hover:bg-neutral-50 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
          aria-label={label}
          title={label}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
