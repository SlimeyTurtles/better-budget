import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay } from "@/lib/utils";

export interface DayStatus {
  day: number;
  date: string;
  spending: number;
  staticDailyBudget: number;
  amortizedDailyBudget: number;
  remainingDays: number;
  remainingDiscretionary: number;
  status: "gold" | "green" | "grey" | "future";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get income config
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!incomeConfig) {
      return NextResponse.json({
        days: [],
        staticDailyBudget: 0,
        totalAvailable: 0,
      });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = monthEnd.getDate();
    const currentDay = today.getDate();

    // Calculate monthly values
    const monthlyIncome = Number(incomeConfig.projectedMonthlyIncome || 0);
    const rentAmount = Number(incomeConfig.rentAmount || 0);
    const utilitiesAmount = Number(incomeConfig.utilitiesAmount || 0);
    const savingsGoalRaw = Number(incomeConfig.monthlySavingsGoal || 0);
    const savingsIsPercent = incomeConfig.savingsIsPercent;

    const savingsGoal = savingsIsPercent
      ? (monthlyIncome * savingsGoalRaw) / 100
      : savingsGoalRaw;

    const fixedCosts = rentAmount + utilitiesAmount;

    // Get savings goals with target dates
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: {
        userId: session.user.id,
        isComplete: false,
        targetDate: { gt: today },
      },
    });

    // Calculate monthly commitment for savings goals
    let totalMonthlySavingsCommitment = 0;
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
            const dailyContribution = remaining / daysUntilDeadline;
            const monthlyContribution = dailyContribution * 30.44;
            totalMonthlySavingsCommitment += monthlyContribution;
          }
        }
      }
    }

    // Total available to spend for the month
    const totalAvailable = monthlyIncome - fixedCosts - savingsGoal - totalMonthlySavingsCommitment;

    // Static daily budget (same every day)
    const staticDailyBudget = totalAvailable / daysInMonth;

    // Get all transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { date: "asc" },
    });

    // Group spending and extra income by day
    const spendingByDay: Record<number, number> = {};
    const extraIncomeByDay: Record<number, number> = {};

    for (const t of transactions) {
      const transactionDate = new Date(t.date);
      const day = transactionDate.getDate();
      const amount = Math.abs(Number(t.amount));

      if (t.isIncome) {
        const category = (t.category || "").toLowerCase();
        if (category !== "salary") {
          extraIncomeByDay[day] = (extraIncomeByDay[day] || 0) + amount;
        }
      } else {
        spendingByDay[day] = (spendingByDay[day] || 0) + amount;
      }
    }

    // Calculate status for each day
    const days: DayStatus[] = [];
    const dailyIncomeRate = monthlyIncome / daysInMonth;
    let cumulativeIncome = 0;
    let cumulativeSpending = 0;
    let cumulativeExtraIncome = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(monthStart);
      dayDate.setDate(day);
      const dateStr = dayDate.toISOString().split("T")[0];

      const daySpending = spendingByDay[day] || 0;
      const dayExtraIncome = extraIncomeByDay[day] || 0;

      // Remaining days including this one
      const remainingDays = daysInMonth - day + 1;

      // For future days
      if (day > currentDay) {
        days.push({
          day,
          date: dateStr,
          spending: 0,
          staticDailyBudget,
          amortizedDailyBudget: 0,
          remainingDays,
          remainingDiscretionary: 0,
          status: "future",
        });
        continue;
      }

      // Add today's income at start of day
      cumulativeIncome += dailyIncomeRate;
      cumulativeExtraIncome += dayExtraIncome;

      // Calculate what was available at the START of this day
      const availableAtStartOfDay = cumulativeIncome + cumulativeExtraIncome - cumulativeSpending;

      // Amortized daily budget for this specific day
      const amortizedDailyBudget = availableAtStartOfDay / remainingDays;

      // Add this day's spending to cumulative
      cumulativeSpending += daySpending;

      // Remaining discretionary after this day's spending
      const remainingDiscretionary = availableAtStartOfDay - daySpending;

      // Determine status
      // Gold = beat the amortized budget (remaining discretionary / remaining days)
      // Green = beat the static budget (total discretionary / total days)
      let status: "gold" | "green" | "grey";
      if (daySpending <= amortizedDailyBudget) {
        // Met the amortized daily budget - gold!
        status = "gold";
      } else if (daySpending <= staticDailyBudget) {
        // Met the static daily budget - green
        status = "green";
      } else {
        // Didn't meet either goal - grey
        status = "grey";
      }

      days.push({
        day,
        date: dateStr,
        spending: Math.round(daySpending * 100) / 100,
        staticDailyBudget: Math.round(staticDailyBudget * 100) / 100,
        amortizedDailyBudget: Math.round(amortizedDailyBudget * 100) / 100,
        remainingDays,
        remainingDiscretionary: Math.round(remainingDiscretionary * 100) / 100,
        status,
      });
    }

    // Count streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let goldDays = 0;
    let greenDays = 0;
    let greyDays = 0;

    for (const day of days) {
      if (day.status === "future") continue;

      if (day.status === "gold") {
        goldDays++;
        tempStreak++;
      } else if (day.status === "green") {
        greenDays++;
        tempStreak++;
      } else {
        greyDays++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    // Check final streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    currentStreak = tempStreak;

    return NextResponse.json({
      days,
      staticDailyBudget: Math.round(staticDailyBudget * 100) / 100,
      totalAvailable: Math.round(totalAvailable * 100) / 100,
      currentDay,
      daysInMonth,
      stats: {
        goldDays,
        greenDays,
        greyDays,
        currentStreak,
        longestStreak,
      },
    });
  } catch (error) {
    console.error("Error fetching daily streak data:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily streak data" },
      { status: 500 }
    );
  }
}
