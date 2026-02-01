"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetRemainingData } from "@/types/dashboard";

interface BudgetRemainingCardProps {
  data: BudgetRemainingData;
}

export function BudgetRemainingCard({ data }: BudgetRemainingCardProps) {
  const isOverBudget = data.percentUsed > 100;
  const isWarning = data.percentUsed >= 80 && data.percentUsed <= 100;

  const getProgressColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (isWarning) return "bg-yellow-500";
    return "bg-purple-500";
  };

  const getBadgeColor = () => {
    if (isOverBudget) return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    if (isWarning) return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
    return "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
  };

  const getValueColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (isWarning) return "text-yellow-600 dark:text-yellow-400";
    return "text-purple-600 dark:text-purple-400";
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className={`inline-flex rounded-lg p-2 ${getBadgeColor()}`}>
        <span className="text-sm font-medium">{data.category}</span>
      </div>
      <div className="flex-1 flex flex-col">
        <p className={`mt-4 text-2xl font-bold ${getValueColor()}`}>
          {formatCurrency(data.remaining)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          of {formatCurrency(data.monthlyLimit)} remaining
        </p>

        {/* Progress bar */}
        <div className="mt-auto pt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(data.percentUsed, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(data.currentSpending)} spent ({data.percentUsed}%)
          </p>
        </div>
      </div>
    </div>
  );
}
