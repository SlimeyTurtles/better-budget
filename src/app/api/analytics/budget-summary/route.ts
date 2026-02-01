import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getBudgetPeriodBounds,
  proRateToMonthly,
  getRemainingDaysInPeriod,
  startOfDay,
  type BudgetPeriodType,
} from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());

    // Get all active budget goals for the user
    const budgetGoals = await prisma.budgetGoal.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: { category: "asc" },
    });

    // Get income config for overall discretionary calculation
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    const monthlyIncome = Number(incomeConfig?.projectedMonthlyIncome || 0);
    const rentAmount = Number(incomeConfig?.rentAmount || 0);
    const utilitiesAmount = Number(incomeConfig?.utilitiesAmount || 0);
    const savingsGoalRaw = Number(incomeConfig?.monthlySavingsGoal || 0);
    const savingsIsPercent = incomeConfig?.savingsIsPercent ?? false;
    const monthlySavingsGoal = savingsIsPercent
      ? (monthlyIncome * savingsGoalRaw) / 100
      : savingsGoalRaw;

    // Process each budget goal with its own period
    const goals = await Promise.all(
      budgetGoals.map(async (goal) => {
        const periodType = goal.periodType as BudgetPeriodType;
        const periodAmount = Number(goal.periodAmount);

        // Calculate period bounds for this budget
        let periodBounds;
        try {
          periodBounds = getBudgetPeriodBounds(periodType, today, {
            startDay: goal.periodStartDay ?? undefined,
            startDate: goal.startDate ?? undefined,
            endDate: goal.endDate ?? undefined,
          });
        } catch {
          // For invalid CUSTOM periods, default to monthly
          periodBounds = getBudgetPeriodBounds("MONTHLY", today);
        }

        // Check if custom period is still active
        if (periodType === "CUSTOM" && goal.endDate) {
          const endDate = new Date(goal.endDate);
          if (today > endDate) {
            // Period has ended
            return {
              id: goal.id,
              category: goal.category,
              periodType,
              periodAmount,
              startDate: goal.startDate?.toISOString().split("T")[0] ?? null,
              endDate: goal.endDate?.toISOString().split("T")[0] ?? null,
              periodStartDay: goal.periodStartDay,
              currentSpending: 0,
              remaining: 0,
              percentUsed: 100,
              isOverBudget: false,
              periodStart: periodBounds.start.toISOString().split("T")[0],
              periodEnd: periodBounds.end.toISOString().split("T")[0],
              daysRemainingInPeriod: 0,
              dailyAllowance: 0,
              monthlyEquivalent: 0,
              isExpired: true,
            };
          }
        }

        // Get transactions for this category within the budget's period
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            date: {
              gte: periodBounds.start,
              lte: periodBounds.end,
            },
            isIncome: false,
            OR: [
              { category: goal.category },
              { personalCategory: goal.category },
            ],
          },
          select: {
            amount: true,
          },
        });

        // Calculate spending
        const currentSpending = transactions.reduce(
          (sum, tx) => sum + Math.abs(Number(tx.amount)),
          0
        );

        const remaining = Math.max(0, periodAmount - currentSpending);
        const percentUsed =
          periodAmount > 0
            ? Math.min(100, Math.round((currentSpending / periodAmount) * 100))
            : 0;

        const daysRemainingInPeriod = getRemainingDaysInPeriod(
          today,
          periodBounds.end
        );
        const dailyAllowance =
          daysRemainingInPeriod > 0 ? remaining / daysRemainingInPeriod : 0;

        const monthlyEquivalent = proRateToMonthly(periodAmount, periodType);

        return {
          id: goal.id,
          category: goal.category,
          periodType,
          periodAmount,
          startDate: goal.startDate?.toISOString().split("T")[0] ?? null,
          endDate: goal.endDate?.toISOString().split("T")[0] ?? null,
          periodStartDay: goal.periodStartDay,
          currentSpending: Math.round(currentSpending * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          percentUsed,
          isOverBudget: currentSpending > periodAmount,
          periodStart: periodBounds.start.toISOString().split("T")[0],
          periodEnd: periodBounds.end.toISOString().split("T")[0],
          daysRemainingInPeriod,
          dailyAllowance: Math.round(dailyAllowance * 100) / 100,
          monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
          isExpired: false,
        };
      })
    );

    // Calculate totals and overall discretionary
    const activeGoals = goals.filter((g) => !g.isExpired);
    const totalBudgetAllocations = activeGoals.reduce(
      (sum, g) => sum + g.monthlyEquivalent,
      0
    );
    const totalCurrentSpending = activeGoals.reduce(
      (sum, g) => sum + g.currentSpending,
      0
    );

    const fixedExpenses = rentAmount + utilitiesAmount;
    const remainingDiscretionary =
      monthlyIncome - fixedExpenses - totalBudgetAllocations - monthlySavingsGoal;

    // Calculate daily discretionary (based on days remaining in month)
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const daysRemainingInMonth = daysInMonth - today.getDate() + 1;
    const dailyDiscretionary =
      daysRemainingInMonth > 0
        ? remainingDiscretionary / daysRemainingInMonth
        : 0;

    return NextResponse.json({
      goals,
      summary: {
        totalMonthlyIncome: monthlyIncome,
        fixedExpenses: Math.round(fixedExpenses * 100) / 100,
        totalBudgetAllocations: Math.round(totalBudgetAllocations * 100) / 100,
        savingsGoal: Math.round(monthlySavingsGoal * 100) / 100,
        remainingDiscretionary: Math.round(remainingDiscretionary * 100) / 100,
        dailyDiscretionary: Math.round(dailyDiscretionary * 100) / 100,
        isOverAllocated: remainingDiscretionary < 0,
        totalCurrentSpending: Math.round(totalCurrentSpending * 100) / 100,
        goalsCount: activeGoals.length,
        overBudgetCount: activeGoals.filter((g) => g.isOverBudget).length,
      },
    });
  } catch (error) {
    console.error("Error fetching budget summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget summary" },
      { status: 500 }
    );
  }
}
