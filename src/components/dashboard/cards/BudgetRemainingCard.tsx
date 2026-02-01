"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetRemainingData } from "@/types/dashboard";

interface BudgetRemainingCardProps {
  data: BudgetRemainingData;
}

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  CUSTOM: "One-time",
};

const PERIOD_COLORS: Record<string, string> = {
  WEEKLY: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  BIWEEKLY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MONTHLY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CUSTOM: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export function BudgetRemainingCard({ data }: BudgetRemainingCardProps) {
  const isOverBudget = data.percentUsed > 100;
  const isWarning = data.percentUsed >= 80 && data.percentUsed <= 100;

  const getProgressColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (isWarning) return "bg-yellow-500";
    return "bg-purple-500";
  };

  const getValueColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (isWarning) return "text-yellow-600 dark:text-yellow-400";
    return "text-purple-600 dark:text-purple-400";
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {data.category}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERIOD_COLORS[data.periodType] || PERIOD_COLORS.MONTHLY}`}>
          {PERIOD_LABELS[data.periodType] || "Monthly"}
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        <p className={`mt-3 text-2xl font-bold ${getValueColor()}`}>
          {formatCurrency(data.remaining)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          of {formatCurrency(data.periodAmount)} remaining
        </p>

        {/* Daily allowance if available */}
        {data.dailyAllowance !== undefined && data.dailyAllowance > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(data.dailyAllowance)}/day safe to spend
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(data.percentUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(data.currentSpending)} spent ({data.percentUsed}%)
            </p>
            {data.daysRemainingInPeriod !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data.daysRemainingInPeriod}d left
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
