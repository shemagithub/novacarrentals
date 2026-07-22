/** @param {string} [currency] "USD" | "RWF" */
export function formatMoney(amount, currency = "USD") {
  const n = Number(amount);
  const cur = currency === "RWF" ? "RWF" : "USD";
  if (!Number.isFinite(n)) {
    return cur === "RWF"
      ? new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(0)
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(0);
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

/** Compact numbers for chart axes */
export function formatMoneyCompact(amount, currency = "USD") {
  const n = Number(amount);
  const cur = currency === "RWF" ? "RWF" : "USD";
  if (!Number.isFinite(n)) return cur === "RWF" ? "0" : "$0";
  if (cur === "RWF") {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
    return String(Math.round(n));
  }
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function currencyFieldSuffix(currency) {
  const c = currency === "RWF" ? "RWF" : "USD";
  return `(${c})`;
}
