import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay } from "@/lib/utils";

type TimePeriod = "daily" | "weekly" | "biweekly" | "monthly";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "monthly") as TimePeriod;

    // Get income config
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!incomeConfig) {
      return NextResponse.json({
        trendlineData: [],
        monthlyIncome: 0,
        rentAmount: 0,
        utilitiesAmount: 0,
        savingsGoal: 0,
        savingsCommitments: 0,
        availableToday: 0,
      });
    }

    // Get savings goals with target dates (these require monthly allocations)
    const today = new Date();
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: {
        userId: session.user.id,
        isComplete: false,
        targetDate: {
          gt: today, // Only goals with future deadlines
        },
      },
    });

    // Calculate total monthly commitment for savings goals
    let totalMonthlySavingsCommitment = 0;
    const todayStart = startOfDay(today);

    for (const goal of savingsGoals) {
      if (goal.targetDate) {
        const targetAmount = Number(goal.targetAmount);
        const currentAmount = Number(goal.currentAmount);
        const remaining = Math.max(0, targetAmount - currentAmount);

        if (remaining > 0) {
          const targetDate = new Date(goal.targetDate);
          const diffTime = targetDate.getTime() - todayStart.getTime();
          const daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysUntilDeadline > 0) {
            // Daily contribution needed * 30.44 (avg days in month)
            const dailyContribution = remaining / daysUntilDeadline;
            const monthlyContribution = dailyContribution * 30.44;
            totalMonthlySavingsCommitment += monthlyContribution;
          }
        }
      }
    }

    const monthlyIncome = Number(incomeConfig.projectedMonthlyIncome || 0);
    const rentAmount = Number(incomeConfig.rentAmount || 0);
    const utilitiesAmount = Number(incomeConfig.utilitiesAmount || 0);
    const savingsGoalRaw = Number(incomeConfig.monthlySavingsGoal || 0);
    const savingsIsPercent = incomeConfig.savingsIsPercent;

    // Calculate actual savings goal
    const savingsGoal = savingsIsPercent
      ? (monthlyIncome * savingsGoalRaw) / 100
      : savingsGoalRaw;

    // Fixed costs (rent + utilities)
    const fixedCosts = rentAmount + utilitiesAmount;

    // Total savings commitments (monthly amount needed for savings goals with deadlines)
    const savingsCommitments = Math.round(totalMonthlySavingsCommitment * 100) / 100;

    // Determine time period boundaries and units
    let periodStart: Date;
    let periodEnd: Date;
    let totalUnits: number;
    let currentUnit: number;
    let unitLabel: string;

    // Calculate pro-rated income for the period
    let periodIncome: number;
    let periodFixedCosts: number;
    let periodSavingsGoal: number;
    let periodCommitments: number;

    switch (period) {
      case "daily": {
        // Daily view - by hour (24 hours)
        periodStart = todayStart;
        periodEnd = new Date(todayStart);
        periodEnd.setHours(23, 59, 59, 999);
        totalUnits = 24;
        currentUnit = today.getHours();
        unitLabel = "hour";
        // Daily amounts
        const daysInMonth = endOfMonth(today).getDate();
        periodIncome = monthlyIncome / daysInMonth;
        periodFixedCosts = fixedCosts / daysInMonth;
        periodSavingsGoal = savingsGoal / daysInMonth;
        periodCommitments = savingsCommitments / daysInMonth;
        break;
      }
      case "weekly": {
        // Weekly view - 7 days
        periodStart = new Date(today);
        periodStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        totalUnits = 7;
        currentUnit = today.getDay();
        unitLabel = "day";
        // Weekly amounts (monthly / ~4.33 weeks)
        periodIncome = monthlyIncome / 4.33;
        periodFixedCosts = fixedCosts / 4.33;
        periodSavingsGoal = savingsGoal / 4.33;
        periodCommitments = savingsCommitments / 4.33;
        break;
      }
      case "biweekly": {
        // Biweekly view - 14 days
        // Find the start of current 2-week period (aligned to start of month for simplicity)
        const monthStart = startOfMonth(today);
        const dayOfMonth = today.getDate();
        const biweeklyPeriod = Math.floor((dayOfMonth - 1) / 14);
        periodStart = new Date(monthStart);
        periodStart.setDate(1 + biweeklyPeriod * 14);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 13);
        // Cap at end of month
        const monthEnd = endOfMonth(today);
        if (periodEnd > monthEnd) periodEnd = monthEnd;
        totalUnits = 14;
        currentUnit = Math.floor((today.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
        unitLabel = "day";
        // Biweekly amounts (monthly / 2)
        periodIncome = monthlyIncome / 2;
        periodFixedCosts = fixedCosts / 2;
        periodSavingsGoal = savingsGoal / 2;
        periodCommitments = savingsCommitments / 2;
        break;
      }
      case "monthly":
      default: {
        // Monthly view - days in month
        periodStart = startOfMonth(today);
        periodEnd = endOfMonth(today);
        totalUnits = periodEnd.getDate();
        currentUnit = today.getDate();
        unitLabel = "day";
        // Full monthly amounts
        periodIncome = monthlyIncome;
        periodFixedCosts = fixedCosts;
        periodSavingsGoal = savingsGoal;
        periodCommitments = savingsCommitments;
        break;
      }
    }

    // Get all transactions for the period (both income and expenses)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { date: "asc" },
    });

    // Daily income rate for the period (projected/amortized)
    const incomePerUnit = totalUnits > 0 ? periodIncome / totalUnits : 0;

    // Build trendline data
    interface TrendlinePoint {
      date: string;
      unit: number;
      label: string;
      income: number;
      rent: number;
      savings: number;
      commitments: number;
      actual: number | null;
    }

    const trendlineData: TrendlinePoint[] = [];

    // Target amounts at end of period
    // Income line: goes from 0 to full period income
    // Rent line: goes from 0 to fixed costs (rent + utilities) - this is what you need to set aside
    // Savings line: goes from 0 to fixed costs + savings goal - total you need to set aside
    // Commitments line: goes from 0 to fixed costs + savings goal + savings goal commitments
    const incomeTarget = periodIncome;
    const rentTarget = periodFixedCosts;
    const savingsTarget = periodFixedCosts + periodSavingsGoal;
    const commitmentsTarget = periodFixedCosts + periodSavingsGoal + periodCommitments;

    // Group transactions by unit (separate income and expenses)
    // Extra income = income transactions that are NOT salary (salary is already in projected income)
    const expensesByUnit: Record<number, number> = {};
    const extraIncomeByUnit: Record<number, number> = {};
    for (const t of transactions) {
      const transactionDate = new Date(t.date);
      let unit: number;
      if (period === "daily") {
        unit = transactionDate.getHours();
      } else if (period === "weekly") {
        unit = transactionDate.getDay();
      } else if (period === "biweekly") {
        unit = Math.floor((transactionDate.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
      } else {
        unit = transactionDate.getDate();
      }
      const amount = Math.abs(Number(t.amount));
      if (t.isIncome) {
        // Exclude salary income (already accounted for in projected income)
        const category = (t.category || "").toLowerCase();
        if (category !== "salary") {
          extraIncomeByUnit[unit] = (extraIncomeByUnit[unit] || 0) + amount;
        }
      } else {
        expensesByUnit[unit] = (expensesByUnit[unit] || 0) + amount;
      }
    }

    let cumulativeExpenses = 0;
    let cumulativeExtraIncome = 0;

    for (let unit = period === "monthly" ? 1 : 0; unit <= (period === "monthly" ? totalUnits : totalUnits - 1); unit++) {
      const unitIndex = period === "monthly" ? unit : unit + 1;

      // Calculate trendline values (linear from 0 to target)
      const progress = unitIndex / totalUnits;
      const incomeValue = incomeTarget * progress;
      const rentValue = rentTarget * progress;
      const savingsValue = savingsTarget * progress;
      const commitmentsValue = commitmentsTarget * progress;

      // Generate label
      let label: string;
      let dateStr: string;
      if (period === "daily") {
        label = `${unit}:00`;
        const d = new Date(todayStart);
        d.setHours(unit);
        dateStr = d.toISOString();
      } else if (period === "weekly") {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        label = dayNames[unit];
        const d = new Date(periodStart);
        d.setDate(periodStart.getDate() + unit);
        dateStr = d.toISOString().split("T")[0];
      } else if (period === "biweekly") {
        const d = new Date(periodStart);
        d.setDate(periodStart.getDate() + unit);
        label = `${d.getMonth() + 1}/${d.getDate()}`;
        dateStr = d.toISOString().split("T")[0];
      } else {
        const d = new Date(periodStart);
        d.setDate(unit);
        label = `${d.getMonth() + 1}/${unit}`;
        dateStr = d.toISOString().split("T")[0];
      }

      // Calculate actual (only for past/current units)
      let actualValue: number | null = null;
      const isCurrentOrPast = period === "monthly" ? unit <= currentUnit : unit <= currentUnit;

      if (isCurrentOrPast) {
        const unitKey = period === "monthly" ? unit : unit;
        cumulativeExpenses += expensesByUnit[unitKey] || 0;
        cumulativeExtraIncome += extraIncomeByUnit[unitKey] || 0;
        // Amortized projected income + extra income (non-salary) - expenses
        const amortizedIncome = incomePerUnit * unitIndex;
        actualValue = amortizedIncome + cumulativeExtraIncome - cumulativeExpenses;
      }

      trendlineData.push({
        date: dateStr,
        unit: period === "monthly" ? unit : unit,
        label,
        income: Math.round(incomeValue * 100) / 100,
        rent: Math.round(rentValue * 100) / 100,
        savings: Math.round(savingsValue * 100) / 100,
        commitments: Math.round(commitmentsValue * 100) / 100,
        actual: actualValue !== null ? Math.round(actualValue * 100) / 100 : null,
      });
    }

    // Calculate available to spend based on projected end-of-month balance
    // 1. Get current actual balance
    const currentDataPoint = trendlineData.find((d) => d.unit === currentUnit);
    const currentActualBalance = currentDataPoint?.actual !== null && currentDataPoint?.actual !== undefined
      ? currentDataPoint.actual
      : 0;

    // 2. Calculate remaining income from now to end of period
    const remainingUnits = totalUnits - currentUnit;
    const remainingIncome = isNaN(incomePerUnit) ? 0 : incomePerUnit * remainingUnits;

    // 3. Projected balance at end of period (if no more spending)
    const projectedEndBalance = currentActualBalance + remainingIncome;

    // 4. Available to spend = projected end balance - commitments target (rent + utilities + savings + goal commitments)
    const availableToSpendTotal = projectedEndBalance - commitmentsTarget;

    // 5. Available per day = total available / remaining days (including today)
    const remainingDaysIncludingToday = Math.max(1, remainingUnits + 1);
    const availablePerDay = availableToSpendTotal / remainingDaysIncludingToday;

    // Get today's expenses for display
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        isIncome: false,
      },
    });

    const todaySpending = todayTransactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Available today = daily budget - what you've already spent today
    const availableToday = availablePerDay - todaySpending;

    return NextResponse.json({
      trendlineData,
      period,
      totalUnits,
      currentUnit,
      unitLabel,
      monthlyIncome,
      rentAmount,
      utilitiesAmount,
      savingsGoal,
      savingsCommitments,
      availableToday: Math.round(availableToday * 100) / 100,
      availablePerDay: Math.round(availablePerDay * 100) / 100,
      availableToSpendTotal: Math.round(availableToSpendTotal * 100) / 100,
      todaySpending: Math.round(todaySpending * 100) / 100,
      projectedEndBalance: Math.round(projectedEndBalance * 100) / 100,
      currentActualBalance: Math.round(currentActualBalance * 100) / 100,
      targets: {
        income: incomeTarget,
        rent: rentTarget,
        savings: savingsTarget,
        commitments: commitmentsTarget,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly budget data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly budget data" },
      { status: 500 }
    );
  }
}
