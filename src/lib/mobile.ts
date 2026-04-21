export function normalizeMobile(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/^\+/, "");
}

