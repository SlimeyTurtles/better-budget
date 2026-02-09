"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetTotalRemainingData } from "@/types/dashboard";

interface BudgetTotalRemainingCardProps {
  data: BudgetTotalRemainingData;
}

export function BudgetTotalRemainingCard({ data }: BudgetTotalRemainingCardProps) {
  const isOverAllocated = data.isOverAllocated;
  const isWarning = data.percentUsed >= 80 && !isOverAllocated;

  const getProgressColor = () => {
    if (isOverAllocated) return "bg-red-500";
    if (isWarning) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getBadgeColor = () => {
    if (isOverAllocated) return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    if (isWarning) return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
    return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400";
  };

  const getValueColor = () => {
    if (isOverAllocated) return "text-red-600 dark:text-red-400";
    if (isWarning) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className={`inline-flex rounded-lg p-2 ${getBadgeColor()}`}>
        <span className="text-sm font-medium">
          {isOverAllocated ? "Over Budget" : "Discretionary"}
        </span>
      </div>
      <div className="flex-1 flex flex-col">
        <p className={`mt-4 text-2xl font-bold ${getValueColor()}`}>
          {formatCurrency(data.remainingDiscretionary)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          after all budgets
        </p>

        {/* Daily discretionary */}
        {data.dailyDiscretionary > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(data.dailyDiscretionary)}/day available
          </p>
        )}

        {/* Progress bar showing budget usage */}
        <div className="mt-auto pt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(data.percentUsed, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(data.totalCurrentSpending)} spent of {formatCurrency(data.totalBudgetAllocations)} budgeted
          </p>
        </div>
      </div>
    </div>
  );
}
