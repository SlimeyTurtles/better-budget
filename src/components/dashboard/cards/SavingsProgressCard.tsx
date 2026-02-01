"use client";

import { formatCurrency } from "@/lib/utils";
import { SavingsProgressData } from "@/types/dashboard";

interface SavingsProgressCardProps {
  data: SavingsProgressData;
}

export function SavingsProgressCard({ data }: SavingsProgressCardProps) {
  const getProgressColor = () => {
    if (data.progressPercent >= 100) return "bg-emerald-500";
    if (data.progressPercent >= 75) return "bg-emerald-400";
    if (data.progressPercent >= 50) return "bg-yellow-400";
    if (data.progressPercent >= 25) return "bg-orange-400";
    return "bg-red-400";
  };

  const formatDaysUntilGoal = (days: number | null | undefined) => {
    if (days === null || days === undefined) return null;
    if (days === 0) return "Goal reached!";
    if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
    if (days < 30) return `${Math.ceil(days / 7)} week${Math.ceil(days / 7) === 1 ? "" : "s"}`;
    if (days < 365) return `${Math.ceil(days / 30)} month${Math.ceil(days / 30) === 1 ? "" : "s"}`;
    return `${(days / 365).toFixed(1)} years`;
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="inline-flex rounded-lg p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
        <span className="text-sm font-medium">{data.name}</span>
      </div>
      <div className="flex-1 flex flex-col">
        <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.currentAmount)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          of {formatCurrency(data.targetAmount)} goal
        </p>

        {/* Progress bar */}
        <div className="mt-auto pt-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(data.progressPercent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {data.progressPercent}% complete
            </span>
            {data.daysUntilGoal !== null && data.daysUntilGoal !== undefined && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {formatDaysUntilGoal(data.daysUntilGoal)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
