"use client";

import { formatCurrency } from "@/lib/utils";
import { AvailableTodayData } from "@/types/dashboard";

interface AvailableTodayCardProps {
  data: AvailableTodayData;
}

export function AvailableTodayCard({ data }: AvailableTodayCardProps) {
  const isOverspent = data.availableToday < 0;

  // Calculate what percentage of daily allowance remains
  const percentUsed = data.availablePerDay > 0
    ? Math.min(100, Math.round((data.todaySpending / data.availablePerDay) * 100))
    : 0;

  const getBgColor = () => {
    if (isOverspent) return "bg-red-500";
    if (percentUsed >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Progress bar showing how much of daily budget is used
  const barWidth = Math.min(percentUsed, 100);

  return (
    <div className={`rounded-xl p-5 shadow-lg text-white ${getBgColor()} h-full flex flex-col`}>
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">
          {isOverspent ? "You've overspent today by" : "You can spend"}
        </p>
        <p className="text-3xl font-bold mt-1">
          {formatCurrency(Math.abs(data.availableToday))}
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          {isOverspent ? "over your daily budget" : "today"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="opacity-80">
            {formatCurrency(data.todaySpending)} spent
          </span>
          <span className="opacity-80">
            {formatCurrency(data.availablePerDay)} daily budget
          </span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverspent ? "bg-white" : "bg-white/80"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
