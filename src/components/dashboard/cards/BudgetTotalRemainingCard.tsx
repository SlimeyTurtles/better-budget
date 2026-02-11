"use client";

import { formatCurrency } from "@/lib/utils";
import { BudgetTotalRemainingData } from "@/types/dashboard";

interface BudgetTotalRemainingCardProps {
  data: BudgetTotalRemainingData;
}

export function BudgetTotalRemainingCard({ data }: BudgetTotalRemainingCardProps) {
  const isOverAllocated = data.isOverAllocated;
  const isWarning = data.percentUsed >= 80 && !isOverAllocated;

  const getGradient = () => {
    if (isOverAllocated) return "bg-gradient-to-r from-red-500 to-red-600";
    if (isWarning) return "bg-gradient-to-r from-amber-500 to-amber-600";
    return "bg-gradient-to-r from-green-500 to-green-600";
  };

  const weeklyDiscretionary = data.dailyDiscretionary * 7;

  return (
    <div className={`rounded-lg p-6 text-white shadow ${getGradient()}`}>
      <h3 className="text-lg font-semibold">
        {isOverAllocated ? "Over Budget" : "Remaining Discretionary"}
      </h3>
      <p className="text-sm opacity-80 mt-1">
        After fixed expenses, budget allocations, and savings goal
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="opacity-80">Total Remaining</p>
          <p className="text-3xl font-bold">
            {formatCurrency(Math.abs(data.remainingDiscretionary))}
          </p>
        </div>
        <div>
          <p className="opacity-80">Daily Allowance</p>
          <p className="text-3xl font-bold">
            {formatCurrency(Math.abs(data.dailyDiscretionary))}
          </p>
        </div>
        <div>
          <p className="opacity-80">Weekly Allowance</p>
          <p className="text-3xl font-bold">
            {formatCurrency(Math.abs(weeklyDiscretionary))}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm opacity-80">
        Based on {data.daysRemaining} days remaining this month
      </p>
    </div>
  );
}
