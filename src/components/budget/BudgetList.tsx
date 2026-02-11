"use client";

import { formatCurrency } from "@/lib/utils";
import type { BudgetPeriodType } from "@/types";

interface BudgetGoal {
  id: string;
  category: string;
  periodType: BudgetPeriodType;
  periodAmount: number;
  startDate?: string | null;
  endDate?: string | null;
  currentSpending: number;
  remaining: number;
  percentUsed: number;
  isOverBudget?: boolean;
  periodStart?: string;
  periodEnd?: string;
  daysRemainingInPeriod?: number;
  dailyAllowance?: number;
  isExpired?: boolean;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  daysUntilGoal?: number | null;
  isComplete?: boolean;
}

interface BudgetListProps {
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  onEditBudget: (id: string) => void;
  onEditSavings: (id: string) => void;
  onDeleteBudget: (id: string) => void;
  onDeleteSavings: (id: string) => void;
}

const PERIOD_LABELS: Record<BudgetPeriodType, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  CUSTOM: "One-time",
};

export function BudgetList({
  budgetGoals,
  savingsGoals,
  onEditBudget,
  onEditSavings,
  onDeleteBudget,
  onDeleteSavings,
}: BudgetListProps) {
  const getProgressColor = (percent: number, isSpending: boolean) => {
    if (isSpending) {
      // For spending: red when over budget, yellow when close, green when safe
      if (percent > 100) return "bg-red-500";
      if (percent >= 80) return "bg-yellow-500";
      return "bg-green-500";
    } else {
      // For savings: more is better
      if (percent >= 100) return "bg-emerald-500";
      if (percent >= 75) return "bg-emerald-400";
      if (percent >= 50) return "bg-yellow-400";
      if (percent >= 25) return "bg-orange-400";
      return "bg-red-400";
    }
  };

  const getPeriodBadgeColor = (periodType: BudgetPeriodType) => {
    switch (periodType) {
      case "WEEKLY":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "BIWEEKLY":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "MONTHLY":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "CUSTOM":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Filter out Emergency Fund from savings goals (it has its own card)
  const filteredSavingsGoals = savingsGoals.filter((g) => g.name !== "Emergency Fund");

  // Separate active and expired budgets
  const activeBudgets = budgetGoals.filter((g) => !g.isExpired);
  const expiredBudgets = budgetGoals.filter((g) => g.isExpired);

  if (activeBudgets.length === 0 && filteredSavingsGoals.length === 0 && expiredBudgets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No budgets created yet.</p>
        <p className="text-sm mt-1">Create your first budget to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spending Limits */}
      {activeBudgets.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {activeBudgets.map((goal) => (
            <div key={goal.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {goal.category}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${getPeriodBadgeColor(goal.periodType)}`}>
                    {PERIOD_LABELS[goal.periodType]}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className={`text-sm font-medium ${
                      goal.percentUsed > 100 ? "text-red-600 dark:text-red-400" :
                      goal.percentUsed >= 80 ? "text-yellow-600 dark:text-yellow-400" :
                      "text-green-600 dark:text-green-400"
                    }`}>
                      {formatCurrency(goal.remaining)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                      / {formatCurrency(goal.periodAmount)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEditBudget(goal.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => onDeleteBudget(goal.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(goal.percentUsed, true)}`} style={{ width: `${Math.min(goal.percentUsed, 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{goal.percentUsed}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expired Budgets */}
      {expiredBudgets.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Expired</p>
          <div className="space-y-1 opacity-60">
            {expiredBudgets.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">{goal.category}</span>
                <button onClick={() => onDeleteBudget(goal.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {filteredSavingsGoals.length > 0 && (
        <div className={activeBudgets.length > 0 ? "pt-2 border-t border-gray-200 dark:border-gray-700" : ""}>
          {activeBudgets.length > 0 && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Savings</p>}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredSavingsGoals.map((goal) => (
              <div key={goal.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-900 dark:text-white truncate">{goal.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onEditSavings(goal.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => onDeleteSavings(goal.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className={`h-full rounded-full transition-all ${getProgressColor(goal.progressPercent, false)}`} style={{ width: `${Math.min(goal.progressPercent, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{goal.progressPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
