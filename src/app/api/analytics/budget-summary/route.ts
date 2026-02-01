import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month date range
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Get all active budget goals for the user
    const budgetGoals = await prisma.budgetGoal.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: { category: "asc" },
    });

    // Get all transactions for the current month (expenses only)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isIncome: false,
      },
      select: {
        amount: true,
        category: true,
        personalCategory: true,
      },
    });

    // Calculate spending per category
    const spendingByCategory = new Map<string, number>();
    for (const tx of transactions) {
      // Use personalCategory if set, otherwise use the transaction category
      const category = tx.personalCategory || tx.category || "Uncategorized";
      const current = spendingByCategory.get(category) || 0;
      spendingByCategory.set(category, current + Math.abs(Number(tx.amount)));
    }

    // Build response with budget goals and their spending
    const goals = budgetGoals.map((goal) => {
      const monthlyLimit = Number(goal.monthlyLimit);
      const currentSpending = spendingByCategory.get(goal.category) || 0;
      const remaining = Math.max(0, monthlyLimit - currentSpending);
      const percentUsed = monthlyLimit > 0
        ? Math.min(100, Math.round((currentSpending / monthlyLimit) * 100))
        : 0;

      return {
        id: goal.id,
        category: goal.category,
        monthlyLimit,
        currentSpending: Math.round(currentSpending * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentUsed,
        isOverBudget: currentSpending > monthlyLimit,
      };
    });

    // Calculate totals
    const totalLimit = goals.reduce((sum, g) => sum + g.monthlyLimit, 0);
    const totalSpending = goals.reduce((sum, g) => sum + g.currentSpending, 0);
    const totalRemaining = Math.max(0, totalLimit - totalSpending);
    const totalPercentUsed = totalLimit > 0
      ? Math.min(100, Math.round((totalSpending / totalLimit) * 100))
      : 0;

    return NextResponse.json({
      goals,
      summary: {
        totalLimit,
        totalSpending: Math.round(totalSpending * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        totalPercentUsed,
        goalsCount: goals.length,
        overBudgetCount: goals.filter((g) => g.isOverBudget).length,
      },
      period: {
        start: monthStart.toISOString().split("T")[0],
        end: monthEnd.toISOString().split("T")[0],
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
