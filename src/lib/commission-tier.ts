export type CommissionTierId = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type CommissionTier = {
  id: CommissionTierId;
  label: string;
  /** Commission rate as a fraction (e.g. 0.02 = 2%) */
  rate: number;
  rangeLabel: string;
  pillClassName: string;
  iconClassName: string;
};

const LAKH = 100_000;

const TIERS: CommissionTier[] = [
  {
    id: "BRONZE",
    label: "Bronze",
    rate: 0.02,
    rangeLabel: "0–15 Lakhs",
    pillClassName:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80 border border-amber-200/60",
    iconClassName: "bg-amber-600 text-white",
  },
  {
    id: "SILVER",
    label: "Silver",
    rate: 0.03,
    rangeLabel: "15–25 Lakhs",
    pillClassName:
      "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200/80 border border-zinc-200/60",
    iconClassName: "bg-zinc-500 text-white",
  },
  {
    id: "GOLD",
    label: "Gold",
    rate: 0.04,
    rangeLabel: "25–35 Lakhs",
    pillClassName:
      "bg-yellow-50 text-yellow-900 ring-1 ring-yellow-200/80 border border-yellow-200/60",
    iconClassName: "bg-yellow-500 text-white",
  },
  {
    id: "PLATINUM",
    label: "Platinum",
    rate: 0.05,
    rangeLabel: "35+ Lakhs",
    pillClassName:
      "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80 border border-sky-200/60",
    iconClassName: "bg-sky-600 text-white",
  },
];

const COMMISSION_SLABS: { from: number; to: number | null; rate: number }[] = [
  { from: 0, to: 15 * LAKH, rate: TIERS[0].rate },
  { from: 15 * LAKH, to: 25 * LAKH, rate: TIERS[1].rate },
  { from: 25 * LAKH, to: 35 * LAKH, rate: TIERS[2].rate },
  { from: 35 * LAKH, to: null, rate: TIERS[3].rate },
];

export function getCommissionTier(totalApprovedDeposits: number): CommissionTier {
  const total = Number.isFinite(totalApprovedDeposits) ? totalApprovedDeposits : 0;
  if (total >= 35 * LAKH) return TIERS[3];
  if (total >= 25 * LAKH) return TIERS[2];
  if (total >= 15 * LAKH) return TIERS[1];
  return TIERS[0];
}

/** Sum commission per slab — each tier rate applies only to cash-in within that band. */
export function calculateProgressiveCommission(totalApprovedDeposits: number): number {
  const total = Number.isFinite(totalApprovedDeposits)
    ? Math.max(0, totalApprovedDeposits)
    : 0;

  let commission = 0;
  for (const slab of COMMISSION_SLABS) {
    if (total <= slab.from) break;
    const slabEnd = slab.to ?? Number.POSITIVE_INFINITY;
    const amountInSlab = Math.min(total, slabEnd) - slab.from;
    if (amountInSlab > 0) {
      commission += amountInSlab * slab.rate;
    }
  }

  return Math.round(commission);
}

export function formatCommissionPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

