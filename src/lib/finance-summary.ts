import { prisma } from "@/lib/prisma";
import { calculateProgressiveCommission } from "@/lib/commission-tier";

export type FinanceSummary = {
  cashIn: number;
  cashOut: number;
  balance: number;
  commission: number;
  actSeconds: number | null;
};

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
  const cashOut =
    (adminDepositAgg._sum.amount ?? 0) + (userWithdrawAgg._sum.amount ?? 0);
  const balance = cashIn - cashOut;
  const commission = calculateProgressiveCommission(cashIn);

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

  return { cashIn, cashOut, balance, commission, actSeconds };
}
