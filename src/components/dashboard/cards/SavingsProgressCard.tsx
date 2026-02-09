"use client";

import { formatCurrency, formatDateShort } from "@/lib/utils";
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

  const formatDaysRemaining = (days: number | null | undefined) => {
    if (days === null || days === undefined) return null;
    if (days <= 0) return "Past deadline";
    if (days === 1) return "1 day left";
    if (days < 7) return `${days} days left`;
    if (days < 30) return `${Math.ceil(days / 7)} week${Math.ceil(days / 7) === 1 ? "" : "s"} left`;
    if (days < 365) return `${Math.ceil(days / 30)} month${Math.ceil(days / 30) === 1 ? "" : "s"} left`;
    return `${(days / 365).toFixed(1)} years left`;
  };

  const hasDeadline = data.targetDate && data.daysUntilDeadline !== null && data.daysUntilDeadline !== undefined;
  const isPastDeadline = hasDeadline && data.daysUntilDeadline! <= 0 && data.progressPercent < 100;
  const isComplete = data.progressPercent >= 100;

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex rounded-lg px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          {data.name}
        </span>
        {hasDeadline && !isComplete && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPastDeadline
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : data.isOnTrack === false
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}>
            {isPastDeadline ? "Overdue" : formatDaysRemaining(data.daysUntilDeadline)}
          </span>
        )}
        {isComplete && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Complete!
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.currentAmount)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          of {formatCurrency(data.targetAmount)} goal
        </p>

        {/* Deadline and contribution info */}
        {hasDeadline && !isComplete && data.contributionNeeded && data.contributionNeeded > 0 && (
          <div className="mt-2 text-xs">
            <p className={`${data.isOnTrack === false ? "text-yellow-600 dark:text-yellow-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              Need {formatCurrency(data.contributionNeeded)}/day to meet deadline
            </p>
            {data.targetDate && (
              <p className="text-gray-400 dark:text-gray-500">
                Due: {formatDateShort(data.targetDate)}
              </p>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-auto pt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(data.progressPercent, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.progressPercent}% complete
          </p>
        </div>
      </div>
    </div>
  );
}
