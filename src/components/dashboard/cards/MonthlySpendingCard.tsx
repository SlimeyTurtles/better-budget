"use client";

import { formatCurrency } from "@/lib/utils";
import { MonthlySpendingData } from "@/types/dashboard";

interface MonthlySpendingCardProps {
  data: MonthlySpendingData;
}

export function MonthlySpendingCard({ data }: MonthlySpendingCardProps) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="inline-flex rounded-lg p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
        <span className="text-sm font-medium">Monthly Spending</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.totalSpending)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This month
        </p>
      </div>
    </div>
  );
}
