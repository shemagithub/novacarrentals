import { useMemo } from "react";
import {
  MARKETING_CURRENCY,
  formatMoney,
  formatMoneyCompact,
  formatRatePerDay,
  type Currency,
} from "@/lib/formatMoney";

export function useFormatMoney() {
  const currency = MARKETING_CURRENCY;
  return useMemo(
    () => ({
      currency,
      formatMoney: (amount: number | string | null | undefined) => formatMoney(amount, currency),
      formatMoneyCompact: (amount: number | string | null | undefined) =>
        formatMoneyCompact(amount, currency),
      formatRatePerDay: (amount: number | string | null | undefined) =>
        formatRatePerDay(amount, currency),
    }),
    [currency],
  );
}

export type { Currency };
