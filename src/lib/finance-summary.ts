import { prisma } from "@/lib/prisma";
import { calculateProgressiveCommission } from "@/lib/commission-tier";

export type FinanceSummary = {
  cashIn: number;
  cashOut: number;
  balance: number;
  commission: number;
  availableCommission: number;
  actSeconds: number | null;
};

/** Gross slab commission minus approved commission withdrawals only. */
export function calculateAvailableCommission(
  grossCommission: number,
  commissionWithdrawn: number,
): number {
  const withdrawn = Number.isFinite(commissionWithdrawn)
    ? Math.max(0, commissionWithdrawn)
    : 0;
  const gross = Number.isFinite(grossCommission) ? Math.max(0, grossCommission) : 0;
  return Math.max(0, gross - withdrawn);
}

export async function getFinanceSummaryForUser(
  userId: string,
): Promise<FinanceSummary> {
  const approved = { userId, status: "APPROVED" as const };

  const [cashInAgg, adminDepositAgg, userWithdrawAgg, actDeposits] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { ...approved, type: "USER_DEPOSIT" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...approved, type: "ADMIN_DEPOSIT" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...approved, type: "USER_WITHDRAW" },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          ...approved,
          type: "USER_DEPOSIT",
          adminId: { not: null },
        },
        select: { createdAt: true, updatedAt: true },
      }),
    ]);

  const cashIn = cashInAgg._sum.amount ?? 0;
  const commissionWithdrawn = userWithdrawAgg._sum.amount ?? 0;
  const cashOut = adminDepositAgg._sum.amount ?? 0;
  const balance = cashIn - cashOut;
  const commission = calculateProgressiveCommission(cashIn);
  const availableCommission = calculateAvailableCommission(
    commission,
    commissionWithdrawn,
  );

  let actSeconds: number | null = null;
  if (actDeposits.length > 0) {
    const totalMs = actDeposits.reduce(
      (sum: number, t: { createdAt: Date; updatedAt: Date }) => {
        const a = t.createdAt.getTime();
        const b = t.updatedAt.getTime();
        const d =
          Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, b - a) : 0;
        return sum + d;
      },
      0,
    );
    actSeconds = totalMs / actDeposits.length / 1000;
  }

  return { cashIn, cashOut, balance, commission, availableCommission, actSeconds };
}
