import { motion, AnimatePresence } from "framer-motion";
import { Car, MessageCircle } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { useLang, translations } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { buildWhatsAppChatUrl, getWhatsAppBaseUrl, openWhatsAppChat } from "@/lib/whatsapp";

function formatDisplayDate(iso: string, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function WhatsAppWidget() {
  const { selection } = useBooking();
  const { language, t } = useLang();
  const { branding, siteName } = useSiteSettings();

  const fromDisplay = selection?.fromDate ? formatDisplayDate(selection.fromDate, language) : "";
  const toDisplay = selection?.toDate ? formatDisplayDate(selection.toDate, language) : "";

  const waMessage =
    selection?.vehicleName && fromDisplay && toDisplay
      ? (translations[language].wa_message as (v: string, f: string, t: string) => string)(
          selection.vehicleName,
          fromDisplay,
          toDisplay,
        )
      : translations[language].wa_generic_message;

  const waUrl = buildWhatsAppChatUrl(getWhatsAppBaseUrl(branding), waMessage);

  function handleOpenWhatsApp() {
    openWhatsAppChat(waUrl);
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      data-testid="whatsapp-widget"
    >
      <AnimatePresence>
        {selection ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            onClick={handleOpenWhatsApp}
            className="max-w-[240px] bg-card border border-[#25D366]/40 shadow-xl px-4 py-3 text-left hover:border-[#25D366] transition-colors"
            data-testid="whatsapp-selection-chip"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#25D366] mb-1">
              {t("wa_send")}
            </p>
            <p className="text-[11px] font-semibold text-foreground truncate flex items-center gap-1.5">
              <Car className="w-3 h-3 text-primary shrink-0" />
              {selection.vehicleName}
            </p>
            {fromDisplay && toDisplay ? (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {fromDisplay} → {toDisplay}
              </p>
            ) : null}
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div className="relative group">
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-[#25D366]/30 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />

        <button
          type="button"
          onClick={handleOpenWhatsApp}
          data-testid="button-whatsapp-open"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bf5b] shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
          aria-label={t("wa_open")}
          title={t("wa_open")}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>

          {selection ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
              <MessageCircle className="w-2.5 h-2.5 text-white" />
            </span>
          ) : null}
        </button>

        <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-card border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hidden sm:block">
          {t("wa_open")}
        </span>
      </div>

      <p className="sr-only">{siteName ? `${siteName} WhatsApp` : "WhatsApp chat"}</p>
    </div>
  );
}
