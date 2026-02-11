"use client";

import { CardType, CardData } from "@/types/dashboard";
import {
  TotalBalanceCard,
  MonthlySpendingCard,
  AvailableTodayCard,
  TotalExpensesCard,
  BudgetRemainingCard,
  BudgetTotalRemainingCard,
  SavingsProgressCard,
} from "./cards";
import { EmergencyFundCard } from "@/components/goals/EmergencyFundCard";

interface DashboardCardProps {
  type: CardType;
  data: CardData["data"];
  onUpdate?: (currentAmount: number, targetAmount: number) => void;
}

export function DashboardCard({ type, data, onUpdate }: DashboardCardProps) {
  switch (type) {
    case "TOTAL_BALANCE":
      return <TotalBalanceCard data={data as CardData["data"] & { assets: number; liabilities: number; netBalance: number }} />;

    case "MONTHLY_SPENDING":
      return <MonthlySpendingCard data={data as { totalSpending: number }} />;

    case "AVAILABLE_TODAY":
      return <AvailableTodayCard data={data as { availableToday: number; availablePerDay: number; availableToSpendTotal: number; todaySpending: number }} />;

    case "TOTAL_EXPENSES":
      return <TotalExpensesCard data={data as { totalExpenses: number }} />;

    case "BUDGET_REMAINING":
      return <BudgetRemainingCard data={data as { category: string; periodType: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM"; periodAmount: number; currentSpending: number; remaining: number; percentUsed: number; daysRemainingInPeriod?: number; dailyAllowance?: number }} />;

    case "BUDGET_TOTAL_REMAINING":
      return <BudgetTotalRemainingCard data={data as { totalMonthlyIncome: number; totalBudgetAllocations: number; remainingDiscretionary: number; dailyDiscretionary: number; daysRemaining: number; totalCurrentSpending: number; percentUsed: number; isOverAllocated: boolean }} />;

    case "SAVINGS_PROGRESS":
      return <SavingsProgressCard data={data as { name: string; targetAmount: number; currentAmount: number; progressPercent: number; targetDate?: string | null; daysUntilDeadline?: number | null; daysUntilGoal?: number | null; contributionNeeded?: number | null; monthlyContributionNeeded?: number | null; isOnTrack?: boolean }} />;

    case "EMERGENCY_FUND": {
      const emergencyData = data as { targetAmount: number; currentAmount: number; progressPercent: number; daysUntilGoal: number | null; dailySavingsRate: number };
      return (
        <EmergencyFundCard
          targetAmount={emergencyData.targetAmount}
          currentAmount={emergencyData.currentAmount}
          progressPercent={emergencyData.progressPercent}
          daysUntilGoal={emergencyData.daysUntilGoal}
          dailySavingsRate={emergencyData.dailySavingsRate}
          onUpdate={onUpdate}
        />
      );
    }

    default:
      return (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-gray-500 dark:text-gray-400">Unknown card type</p>
        </div>
      );
  }
}
