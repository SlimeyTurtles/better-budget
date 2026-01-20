import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, addDays } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly"; // daily, weekly, monthly
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to current month if no dates provided
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? new Date(endDateParam) : endOfMonth(now);

    // Fetch transactions (excluding income)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isIncome: false,
        amount: { gt: 0 }, // Only expenses (positive amounts in Plaid)
      },
      orderBy: { date: "asc" },
    });

    // Aggregate by period
    const spendingData = aggregateByPeriod(transactions, period, startDate, endDate);

    // Calculate totals
    const totalSpending = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    for (const t of transactions) {
      const cat = t.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      spendingData,
      totalSpending,
      categoryBreakdown,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching spending data:", error);
    return NextResponse.json(
      { error: "Failed to fetch spending data" },
      { status: 500 }
    );
  }
}

interface Transaction {
  date: Date;
  amount: unknown;
  category: string | null;
}

function aggregateByPeriod(
  transactions: Transaction[],
  period: string,
  startDate: Date,
  endDate: Date
) {
  const data: { date: string; amount: number }[] = [];

  if (period === "daily") {
    // Create a map of date to amount
    const dateMap: Record<string, number> = {};
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dateMap[dateStr] = 0;
      currentDate = addDays(currentDate, 1);
    }

    for (const t of transactions) {
      const dateStr = new Date(t.date).toISOString().split("T")[0];
      if (dateMap[dateStr] !== undefined) {
        dateMap[dateStr] += Number(t.amount);
      }
    }

    for (const [date, amount] of Object.entries(dateMap)) {
      data.push({ date, amount });
    }
  } else if (period === "weekly") {
    // Group by week
    const weekMap: Record<string, number> = {};

    for (const t of transactions) {
      const date = new Date(t.date);
      const weekStart = getWeekStart(date);
      const weekStr = weekStart.toISOString().split("T")[0];
      weekMap[weekStr] = (weekMap[weekStr] || 0) + Number(t.amount);
    }

    for (const [date, amount] of Object.entries(weekMap).sort()) {
      data.push({ date, amount });
    }
  } else {
    // Monthly
    const monthMap: Record<string, number> = {};

    for (const t of transactions) {
      const date = new Date(t.date);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap[monthStr] = (monthMap[monthStr] || 0) + Number(t.amount);
    }

    for (const [date, amount] of Object.entries(monthMap).sort()) {
      data.push({ date, amount });
    }
  }

  return data;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
