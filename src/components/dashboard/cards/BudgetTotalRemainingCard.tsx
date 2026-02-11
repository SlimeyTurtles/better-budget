"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetTotalRemainingData } from "@/types/dashboard";

interface BudgetTotalRemainingCardProps {
  data: BudgetTotalRemainingData;
}

export function BudgetTotalRemainingCard({ data }: BudgetTotalRemainingCardProps) {
  const isOverAllocated = data.isOverAllocated;
  const isWarning = data.percentUsed >= 80 && !isOverAllocated;
  const remainingPercent = Math.max(0, 100 - Math.min(data.percentUsed, 100));

  const getBgColor = () => {
    if (isOverAllocated) return "bg-red-500";
    if (isWarning) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={`rounded-xl p-5 shadow-lg text-white ${getBgColor()} h-full flex flex-col`}>
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">
          {isOverAllocated ? "Over budget by" : "You have"}
        </p>
        <p className="text-3xl font-bold mt-1">
          {formatCurrency(Math.abs(data.remainingDiscretionary))}
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          {isOverAllocated ? "over your allocations" : "left for discretionary"}
        </p>
      </div>

      {/* Budget usage bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="opacity-80">
            {formatCurrency(data.totalCurrentSpending)} spent
          </span>
          <span className="opacity-80">
            {formatCurrency(data.dailyDiscretionary)}/day
          </span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${100 - remainingPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
