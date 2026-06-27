import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Car, Calendar, ChevronRight } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { useLang, translations } from "@/contexts/LanguageContext";

const WHATSAPP_NUMBER = "250788000000";

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
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (selection) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [selection]);

  const fromDisplay = selection?.fromDate ? formatDisplayDate(selection.fromDate, language) : "";
  const toDisplay = selection?.toDate ? formatDisplayDate(selection.toDate, language) : "";

  const waMessage = selection?.vehicleName && fromDisplay && toDisplay
    ? (translations[language].wa_message as (v: string, f: string, t: string) => string)(
        selection.vehicleName,
        fromDisplay,
        toDisplay
      )
    : translations[language].wa_generic_message;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      data-testid="whatsapp-widget"
    >
      {/* Chat Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-80 bg-card border border-border shadow-2xl overflow-hidden"
            data-testid="whatsapp-popup"
          >
            {/* Header */}
            <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-display font-bold text-sm leading-tight">
                    NOVACAR Rentals
                  </p>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    {t("wa_reply")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
                data-testid="button-close-whatsapp"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat bubble area */}
            <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[140px]">
              {/* Greeting bubble */}
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#075E54] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">NC</span>
                </div>
                <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[220px]">
                  <p className="text-[#111] text-xs leading-relaxed">
                    {t("wa_greeting")} 🚗
                  </p>
                  <p className="text-[10px] text-[#999] text-right mt-1">Now</p>
                </div>
              </div>

              {/* Pre-filled selection card */}
              {selection ? (
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm max-w-[230px] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#111] font-semibold">
                      <Car className="w-3 h-3 text-[#075E54]" />
                      {selection.vehicleName}
                    </div>
                    {selection.fromDate && selection.toDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
                        <Calendar className="w-3 h-3 text-[#075E54]" />
                        {fromDisplay} → {toDisplay}
                      </div>
                    )}
                    <p className="text-[10px] text-[#999] text-right">{t("wa_sending")}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm max-w-[200px]">
                    <p className="text-[#111] text-xs">
                      {t("wa_generic")}
                    </p>
                    <p className="text-[10px] text-[#999] text-right mt-1">Now</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selection summary strip */}
            {selection && (
              <div className="bg-muted border-t border-border px-4 py-2">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Car className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-primary font-semibold">{selection.vehicleName}</span>
                  {selection.fromDate && selection.toDate && (
                    <> · {fromDisplay} → {toDisplay}</>
                  )}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="p-4 bg-card border-t border-border">
              {!selection && (
                <p className="text-[11px] text-muted-foreground mb-3 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  {t("wa_hint")}
                </p>
              )}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-open-whatsapp"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bf5b] text-white text-xs font-bold uppercase tracking-wider py-3 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {selection ? t("wa_send") : t("wa_open")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <div className="relative">
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-60" />
        )}

        <AnimatePresence>
          {selection && !open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="absolute -top-10 right-0 bg-card border border-border px-3 py-1.5 shadow-lg whitespace-nowrap max-w-[220px]"
            >
              <p className="text-[11px] font-semibold text-foreground truncate flex items-center gap-1.5">
                <Car className="w-3 h-3 text-primary shrink-0" />
                {selection.vehicleName} selected
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          data-testid="button-whatsapp-toggle"
          className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bf5b] shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
          aria-label="Chat on WhatsApp"
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          )}

          {selection && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
