/** Review states: draft → pending review → approved | rejected */
export type ReviewStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export function isPendingReview(status: string): boolean {
  const s = status.toUpperCase();
  return s === "PENDING" || s === "SUBMITTED";
}

/** Human-readable label for admin UI */
export function statusDisplayLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "PENDING" || s === "SUBMITTED") return "Pending";
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "DRAFT") return "Draft";
  return status;
}
