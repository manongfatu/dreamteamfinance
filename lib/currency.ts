export const CURRENCY_LOCALE = "en-PH";
export const CURRENCY_CODE = "PHP";

export function formatCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return amount.toLocaleString(CURRENCY_LOCALE, { style: "currency", currency: CURRENCY_CODE });
}
