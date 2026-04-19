export const PHONE_DIAL_CODES = ["+880", "+92", "+91"] as const;

export const DEFAULT_PHONE_DIAL = "+91";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** e.g. dial "+91", local "98765 43210" → "919876543210" (matches API normalize) */
export function combineDialAndLocal(dial: string, local: string): string {
  const d = dial.replace(/^\+/, "").replace(/\D/g, "");
  const n = digitsOnly(local);
  if (!d || !n) return "";
  return `${d}${n}`;
}
