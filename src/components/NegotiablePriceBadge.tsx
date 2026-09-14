import { useLang } from "@/contexts/LanguageContext";

export function NegotiablePriceBadge({
  variant = "card",
}: {
  variant?: "card" | "hero";
}) {
  const { t } = useLang();

  if (variant === "hero") {
    return (
      <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur border border-border px-5 py-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">
          {t("fleet_price_label")}
        </p>
        <p className="text-2xl md:text-3xl font-display font-bold text-foreground">
          {t("fleet_negotiable_short")}
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-3 py-1 text-sm font-bold uppercase tracking-wider">
      {t("fleet_negotiable")}
    </div>
  );
}
