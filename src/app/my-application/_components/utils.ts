import type { TransactionRow } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function downloadCsvStatement(mobile: string, rows: TransactionRow[]) {
  const safeMobile = (mobile || "user").replace(/[^\w.-]+/g, "_").slice(0, 50);
  const filename = `statement-${safeMobile}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  // Sort ascending for running balance
  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let balance = 0;
  const lines: string[] = [];
  lines.push(
    [
      "Date+Time",
      "Wallet Details",
      "Transaction ID",
      "Withdrawal",
      "Deposits",
      "Balance",
      "Type",
      "Status",
    ].join(","),
  );

  for (const t of sorted) {
    const amt =
      typeof t.amount === "number" && Number.isFinite(t.amount) ? t.amount : 0;
    const withdrawal = 0;
    const deposit = amt;
    balance += deposit - withdrawal;

    const walletDetails =
      (t.walletProvider || t.method || "") + (t.walletId ? ` - ${t.walletId}` : "");

    const cols = [
      new Date(t.createdAt).toLocaleString(),
      walletDetails,
      t.transactionNo ?? "",
      String(withdrawal),
      String(deposit),
      String(balance),
      t.type,
      t.status,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`);

    lines.push(cols.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

