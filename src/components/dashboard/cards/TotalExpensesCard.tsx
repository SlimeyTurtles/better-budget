"use client";

import { formatCurrency } from "@/lib/utils";
import { TotalExpensesData } from "@/types/dashboard";

interface TotalExpensesCardProps {
  data: TotalExpensesData;
}

export function TotalExpensesCard({ data }: TotalExpensesCardProps) {
  // Calculate day of month progress for context
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  return (
    <div className="rounded-xl bg-orange-500 text-white p-5 shadow-lg h-full flex flex-col">
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">Total expenses</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(data.totalExpenses)}</p>
        <p className="text-sm opacity-90 mt-0.5">this period</p>
      </div>

      {/* Info footer */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <div className="flex justify-between text-xs">
          <span className="opacity-80 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {daysRemaining} days remaining
          </span>
          <span className="opacity-80 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            All categories
          </span>
        </div>
      </div>
    </div>
  );
}
