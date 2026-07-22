export type Currency = "USD" | "RWF";

/** Public marketing site always displays prices in USD. */
export const MARKETING_CURRENCY: Currency = "USD";

export function normalizeCurrency(currency: string | null | undefined): Currency {
  return currency === "RWF" ? "RWF" : "USD";
}

export function formatMoney(amount: number | string | null | undefined, currency: Currency = "USD"): string {
  const n = Number(amount);
  const cur = normalizeCurrency(currency);
  if (!Number.isFinite(n)) {
    return cur === "RWF"
      ? new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(0)
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(0);
  }
  if (cur === "RWF") {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatMoneyCompact(amount: number | string | null | undefined, currency: Currency = "USD"): string {
  const n = Number(amount);
  const cur = normalizeCurrency(currency);
  if (!Number.isFinite(n)) return cur === "RWF" ? "0" : "$0.00";
  if (cur === "RWF") {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
    return String(Math.round(n));
  }
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function currencyFieldSuffix(currency: Currency = "USD"): string {
  return `(${normalizeCurrency(currency)})`;
}

/** Price with optional /day suffix, e.g. "$120.00/day" */
export function formatRatePerDay(
  amount: number | string | null | undefined,
  currency: Currency = "USD",
): string {
  return `${formatMoney(amount, currency)}/day`;
}
