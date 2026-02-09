"use client";

import { formatCurrency } from "@/lib/utils";
import { AvailableTodayData } from "@/types/dashboard";

interface AvailableTodayCardProps {
  data: AvailableTodayData;
}

export function AvailableTodayCard({ data }: AvailableTodayCardProps) {
  const isPositive = data.availableToday >= 0;
  const isTotalPositive = data.availableToSpendTotal >= 0;
  const colorClass = isPositive
    ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
    : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
  const valueColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const totalColor = isTotalPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className={`inline-flex rounded-lg p-2 ${colorClass}`}>
        <span className="text-sm font-medium">Available Today</span>
      </div>
      <div className="flex-1 flex flex-col">
        <p className={`mt-4 text-2xl font-bold ${valueColor}`}>
          {formatCurrency(data.availableToday)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(data.availablePerDay)}/day - {formatCurrency(data.todaySpending)} spent
        </p>
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Available til end of month</p>
          <p className={`text-lg font-semibold ${totalColor}`}>
            {formatCurrency(data.availableToSpendTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
