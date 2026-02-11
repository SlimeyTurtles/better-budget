"use client";

import { formatCurrency } from "@/lib/utils";
import { MonthlySpendingData } from "@/types/dashboard";

interface MonthlySpendingCardProps {
  data: MonthlySpendingData;
}

export function MonthlySpendingCard({ data }: MonthlySpendingCardProps) {
  // Calculate day of month progress
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

  // Get month name
  const monthName = today.toLocaleString("default", { month: "long" });

  return (
    <div className="rounded-xl bg-rose-500 text-white p-5 shadow-lg h-full flex flex-col">
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">You&apos;ve spent</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(data.totalSpending)}</p>
        <p className="text-sm opacity-90 mt-0.5">this {monthName}</p>
      </div>

      {/* Month progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="opacity-80">Day {dayOfMonth}</span>
          <span className="opacity-80">{daysRemaining} days left</span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
