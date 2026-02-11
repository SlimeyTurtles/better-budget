"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetRemainingData } from "@/types/dashboard";

interface BudgetRemainingCardProps {
  data: BudgetRemainingData;
}

export function BudgetRemainingCard({ data }: BudgetRemainingCardProps) {
  const isOverBudget = data.percentUsed > 100;
  const isWarning = data.percentUsed >= 80 && data.percentUsed <= 100;
  const percentUsed = Math.min(data.percentUsed, 100);

  const getBgColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (isWarning) return "bg-amber-500";
    return "bg-violet-500";
  };

  return (
    <div className={`rounded-xl p-5 shadow-lg text-white ${getBgColor()} h-full flex flex-col`}>
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90 truncate">
          {isOverBudget ? `Over budget for ${data.category}` : data.category}
        </p>
        <p className="text-3xl font-bold mt-1">
          {formatCurrency(Math.abs(data.remaining))}
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          {isOverBudget ? "over budget" : "remaining"}
        </p>
      </div>

      {/* Budget usage bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="opacity-80">
            {formatCurrency(data.currentSpending)} spent
          </span>
          <span className="opacity-80">
            {formatCurrency(data.periodAmount)} budget
          </span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        {data.daysRemainingInPeriod !== undefined && (
          <p className="text-xs opacity-70 mt-2">
            {data.daysRemainingInPeriod} days left in period
          </p>
        )}
      </div>
    </div>
  );
}
