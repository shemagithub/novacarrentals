import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ArrowRight, X, Car, MapPin, Shield } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  buildWhatsAppChatUrl,
  formatBookingWhatsAppMessage,
  getWhatsAppBaseUrl,
  openWhatsAppChat,
} from "@/lib/whatsapp";

const WA_SVG = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function plusDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatShort(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface QuickBookButtonProps {
  vehicleName: string;
  vehicleId: string;
  pricePerDay: number;
  destination?: string;
  /** Visual variant: "primary" (solid red), "whatsapp" (green), "outline" */
  variant?: "primary" | "whatsapp" | "outline";
  label?: string;
  className?: string;
}

export function QuickBookButton({
  vehicleName,
  vehicleId,
  pricePerDay,
  destination,
  variant = "primary",
  label = "Book This Vehicle",
  className = "",
}: QuickBookButtonProps) {
  const { formatMoney, formatRatePerDay } = useFormatMoney();
  const { triggerBooking } = useBooking();
  const { branding, siteName } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(plusDaysISO(7));
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Days between dates
  const days = Math.max(
    1,
    Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000),
  );
  const total = days * pricePerDay;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSubmit() {
    const payload = { vehicleName, vehicleId, fromDate, toDate, pricePerDay, destination };
    triggerBooking(payload);

    const message = formatBookingWhatsAppMessage(
      vehicleName,
      formatShort(fromDate),
      formatShort(toDate),
      siteName || "NOVACAR",
    );
    const url = buildWhatsAppChatUrl(getWhatsAppBaseUrl(branding), message);
    openWhatsAppChat(url);

    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
    }, 800);
  }

  const baseButton: Record<string, string> = {
    primary:
      "inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 transition-colors",
    whatsapp:
      "inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bf5b] text-white font-display font-bold uppercase tracking-wider text-sm px-6 py-3 transition-colors",
    outline:
      "inline-flex items-center justify-center gap-2 border border-border hover:border-primary/60 text-foreground hover:text-primary font-display font-bold uppercase tracking-wider text-sm px-6 py-3 transition-colors",
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`${baseButton[variant]} w-full`}
      >
        {variant === "whatsapp" ? WA_SVG : <CalendarDays className="w-4 h-4" />}
        {label}
        {variant === "primary" && <ArrowRight className="w-4 h-4" />}
      </button>

      {/* Date-picker panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-card border border-border shadow-2xl overflow-hidden min-w-[300px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm text-foreground truncate max-w-[200px]">
                  {vehicleName}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Destination tag */}
              {destination && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-primary truncate">{destination}</span>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Pick-up Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    min={todayISO()}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      if (e.target.value >= toDate) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 1);
                        setToDate(d.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full bg-background border border-border text-foreground text-xs px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-background border border-border text-foreground text-xs px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Price preview */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-muted border border-border">
                <span className="text-xs text-muted-foreground">
                  {days} {days === 1 ? "day" : "days"} × {formatRatePerDay(pricePerDay)}
                </span>
                <span className="font-display font-bold text-foreground">{formatMoney(total)}</span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitted}
                className={`w-full flex items-center justify-center gap-2 py-3 text-white font-bold text-xs uppercase tracking-wider transition-all ${
                  submitted
                    ? "bg-emerald-600"
                    : "bg-[#25D366] hover:bg-[#20bf5b]"
                }`}
              >
                {submitted ? (
                  <>✓ Opening WhatsApp…</>
                ) : (
                  <>{WA_SVG} Send WhatsApp Inquiry</>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-primary" />
                No payment required · Confirmed within 2 hours
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
