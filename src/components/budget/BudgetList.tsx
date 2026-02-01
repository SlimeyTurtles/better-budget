"use client";

import { formatCurrency } from "@/lib/utils";

interface BudgetGoal {
  id: string;
  category: string;
  monthlyLimit: number;
  currentSpending: number;
  remaining: number;
  percentUsed: number;
  isOverBudget?: boolean;
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

export function BudgetList({
  budgetGoals,
  savingsGoals,
  onEditBudget,
  onEditSavings,
  onDeleteBudget,
  onDeleteSavings,
}: BudgetListProps) {
  const formatDays = (days: number | null | undefined) => {
    if (days === null || days === undefined) return null;
    if (days === 0) return "Complete!";
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.ceil(days / 7)}w`;
    if (days < 365) return `${Math.ceil(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  };

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

  // Filter out Emergency Fund from savings goals (it has its own card)
  const filteredSavingsGoals = savingsGoals.filter((g) => g.name !== "Emergency Fund");

  if (budgetGoals.length === 0 && filteredSavingsGoals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No budgets created yet.</p>
        <p className="text-sm mt-1">Create your first budget to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spending Limits Section */}
      {budgetGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Spending Limits
          </h4>
          <div className="space-y-3">
            {budgetGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {goal.category}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(goal.currentSpending)} of {formatCurrency(goal.monthlyLimit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        goal.percentUsed > 100
                          ? "text-red-600 dark:text-red-400"
                          : goal.percentUsed >= 80
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {formatCurrency(goal.remaining)} left
                    </span>
                    <button
                      onClick={() => onEditBudget(goal.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteBudget(goal.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(goal.percentUsed, true)}`}
                    style={{ width: `${Math.min(goal.percentUsed, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {goal.percentUsed}% used
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals Section */}
      {filteredSavingsGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Savings Goals
          </h4>
          <div className="space-y-3">
            {filteredSavingsGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {goal.name}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.daysUntilGoal !== null && goal.daysUntilGoal !== undefined && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatDays(goal.daysUntilGoal)}
                      </span>
                    )}
                    <button
                      onClick={() => onEditSavings(goal.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteSavings(goal.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(goal.progressPercent, false)}`}
                    style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {goal.progressPercent}% complete
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
