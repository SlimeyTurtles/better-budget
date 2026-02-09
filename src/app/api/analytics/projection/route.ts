import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("daysBack") || "30");
    const daysForward = parseInt(searchParams.get("daysForward") || "60");

    // Get income config
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    // Get current balances
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id, isHidden: false },
    });

    let currentBalance = 0;
    for (const account of accounts) {
      const balance = Number(account.currentBalance || 0);
      if (account.type === "CREDIT" || account.type === "LOAN") {
        currentBalance -= Math.abs(balance);
      } else {
        currentBalance += balance;
      }
    }

    // Get historical transactions for actual spending
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    // Build daily balance history
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate daily spending/income from transactions
    const dailyChanges: Record<string, number> = {};
    for (const t of transactions) {
      const dateStr = new Date(t.date).toISOString().split("T")[0];
      const amount = Number(t.amount);
      // Plaid: positive = expense, negative = income
      dailyChanges[dateStr] = (dailyChanges[dateStr] || 0) - amount;
    }

    // Generate projection data
    const projectionData: Array<{
      date: string;
      actual?: number;
      projected?: number;
      isToday?: boolean;
    }> = [];

    // Calculate what the balance was at the start
    // We work backwards from current balance
    let runningBalance = currentBalance;
    const todayStr = today.toISOString().split("T")[0];

    // First, collect all past dates and their changes
    const pastDates: string[] = [];
    let tempDate = new Date(startDate);
    while (tempDate <= today) {
      pastDates.push(tempDate.toISOString().split("T")[0]);
      tempDate = addDays(tempDate, 1);
    }

    // Calculate starting balance by reversing all changes
    let startingBalance = currentBalance;
    for (const dateStr of pastDates) {
      if (dailyChanges[dateStr]) {
        startingBalance -= dailyChanges[dateStr];
      }
    }

    // Now build the actual history forward
    runningBalance = startingBalance;
    for (const dateStr of pastDates) {
      if (dailyChanges[dateStr]) {
        runningBalance += dailyChanges[dateStr];
      }
      projectionData.push({
        date: dateStr,
        actual: runningBalance,
        isToday: dateStr === todayStr,
      });
    }

    // Project future based on income config
    if (incomeConfig) {
      const monthlyIncome = Number(incomeConfig.projectedMonthlyIncome);
      const payFrequency = incomeConfig.payFrequency;

      // Calculate income per pay period
      let incomePerPay = monthlyIncome;
      let daysBetweenPay = 30;

      switch (payFrequency) {
        case "WEEKLY":
          incomePerPay = monthlyIncome / 4.33;
          daysBetweenPay = 7;
          break;
        case "BIWEEKLY":
          incomePerPay = monthlyIncome / 2.17;
          daysBetweenPay = 14;
          break;
        case "SEMIMONTHLY":
          incomePerPay = monthlyIncome / 2;
          daysBetweenPay = 15;
          break;
        case "MONTHLY":
          incomePerPay = monthlyIncome;
          daysBetweenPay = 30;
          break;
      }

      // Project future days
      let projectedBalance = currentBalance;
      let daysSinceLastPay = 0;

      for (let i = 1; i <= daysForward; i++) {
        const futureDate = addDays(today, i);
        const dateStr = futureDate.toISOString().split("T")[0];

        daysSinceLastPay++;

        // Add income on pay days
        if (daysSinceLastPay >= daysBetweenPay) {
          projectedBalance += incomePerPay;
          daysSinceLastPay = 0;
        }

        projectionData.push({
          date: dateStr,
          projected: projectedBalance,
        });
      }
    }

    return NextResponse.json({
      projectionData,
      currentBalance,
      incomeConfig: incomeConfig
        ? {
            monthlyIncome: Number(incomeConfig.projectedMonthlyIncome),
            payFrequency: incomeConfig.payFrequency,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching projection data:", error);
    return NextResponse.json(
      { error: "Failed to fetch projection data" },
      { status: 500 }
    );
  }
}
