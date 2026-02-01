"use client";

import { useEffect, useState, useCallback } from "react";
import { SpendingOverTimeChart } from "@/components/charts/SpendingOverTimeChart";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { BudgetModal, BudgetList } from "@/components/budget";
import { formatCurrency } from "@/lib/utils";
import type { BudgetPeriodType, EnhancedBudgetGoal, BudgetSummary } from "@/types";

interface SpendingData {
  spendingData: Array<{ date: string; amount: number }>;
  totalSpending: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate?: string | null;
  daysUntilGoal?: number | null;
  isComplete?: boolean;
}

export default function BudgetPage() {
  const [spending, setSpending] = useState<SpendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Budget management state
  const [budgetGoals, setBudgetGoals] = useState<EnhancedBudgetGoal[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    type: "spending" | "savings";
    category?: string;
    name?: string;
    periodType?: BudgetPeriodType;
    periodAmount?: number;
    startDate?: string | null;
    endDate?: string | null;
    periodStartDay?: number | null;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: string | null;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [spendingRes, savingsGoalsRes, budgetSummaryRes] = await Promise.all([
        fetch(`/api/analytics/spending?period=${period}`),
        fetch("/api/savings-goals"),
        fetch("/api/analytics/budget-summary"),
      ]);

      const spendingData = await spendingRes.json();
      const savingsGoalsData = await savingsGoalsRes.json();
      const budgetSummaryData = await budgetSummaryRes.json();

      setSpending(spendingData);
      setBudgetGoals(budgetSummaryData.goals || []);
      setBudgetSummary(budgetSummaryData.summary || null);
      setSavingsGoals(savingsGoalsData.goals || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle creating/updating a budget
  const handleSaveBudget = async (data: {
    type: "spending" | "savings";
    category?: string;
    name?: string;
    periodType?: BudgetPeriodType;
    periodAmount?: number;
    startDate?: string;
    endDate?: string;
    periodStartDay?: number;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: string;
  }) => {
    if (editingBudget) {
      // Update existing
      if (data.type === "spending") {
        const res = await fetch(`/api/budget-goals/${editingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: data.category,
            periodType: data.periodType,
            periodAmount: data.periodAmount,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            periodStartDay: data.periodStartDay ?? null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update budget");
        }
      } else {
        const res = await fetch(`/api/savings-goals/${editingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount,
            targetDate: data.targetDate || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update savings goal");
        }
      }
    } else {
      // Create new
      if (data.type === "spending") {
        const res = await fetch("/api/budget-goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: data.category,
            periodType: data.periodType || "MONTHLY",
            periodAmount: data.periodAmount,
            startDate: data.startDate,
            endDate: data.endDate,
            periodStartDay: data.periodStartDay,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create budget");
        }
      } else {
        const res = await fetch("/api/savings-goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount || 0,
            targetDate: data.targetDate || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create savings goal");
        }
      }
    }
    setEditingBudget(null);
    fetchData();
  };

  // Handle editing a budget
  const handleEditBudget = (id: string) => {
    const goal = budgetGoals.find((g) => g.id === id);
    if (goal) {
      setEditingBudget({
        id,
        type: "spending",
        category: goal.category,
        periodType: goal.periodType,
        periodAmount: goal.periodAmount,
        startDate: goal.startDate,
        endDate: goal.endDate,
        periodStartDay: goal.periodStartDay,
      });
      setIsModalOpen(true);
    }
  };

  const handleEditSavings = (id: string) => {
    const goal = savingsGoals.find((g) => g.id === id);
    if (goal) {
      setEditingBudget({
        id,
        type: "savings",
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
      });
      setIsModalOpen(true);
    }
  };

  // Handle deleting a budget
  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    try {
      await fetch(`/api/budget-goals/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleDeleteSavings = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
      await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting savings goal:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Use budget summary data for metrics
  const monthlyIncome = budgetSummary?.totalMonthlyIncome || 0;
  const fixedExpenses = budgetSummary?.fixedExpenses || 0;
  const totalBudgetAllocations = budgetSummary?.totalBudgetAllocations || 0;
  const savingsGoal = budgetSummary?.savingsGoal || 0;
  const remainingDiscretionary = budgetSummary?.remainingDiscretionary || 0;
  const dailyDiscretionary = budgetSummary?.dailyDiscretionary || 0;
  const totalSpent = spending?.totalSpending || 0;
  const isOverAllocated = budgetSummary?.isOverAllocated || false;

  // Calculate days remaining
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - today.getDate() + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track your spending against your budget
        </p>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Income</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fixed Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(fixedExpenses)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Rent + Utilities
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Allocations</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalBudgetAllocations)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            + {formatCurrency(savingsGoal)} savings
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spent This Month</p>
          <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      {/* Discretionary Spending */}
      {monthlyIncome > 0 && (
        <div
          className={`rounded-lg p-6 text-white shadow ${
            isOverAllocated
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-green-500 to-green-600"
          }`}
        >
          <h3 className="text-lg font-semibold">
            {isOverAllocated ? "Over-Allocated Budget" : "Remaining Discretionary"}
          </h3>
          <p className="text-sm opacity-80 mt-1">
            After fixed expenses, budget allocations, and savings goal
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="opacity-80">Total Remaining</p>
              <p className="text-3xl font-bold">
                {formatCurrency(remainingDiscretionary)}
              </p>
            </div>
            <div>
              <p className="opacity-80">Daily Allowance</p>
              <p className="text-3xl font-bold">
                {formatCurrency(dailyDiscretionary)}
              </p>
            </div>
            <div>
              <p className="opacity-80">Weekly Allowance</p>
              <p className="text-3xl font-bold">
                {formatCurrency(dailyDiscretionary * 7)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Based on {daysRemaining} days remaining this month
          </p>
          {isOverAllocated && (
            <p className="mt-2 text-sm font-medium">
              Your budget allocations exceed your available income. Consider reducing some budgets.
            </p>
          )}
        </div>
      )}

      {/* Budgets Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Budgets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set spending limits and savings goals
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Budget
          </button>
        </div>

        <BudgetList
          budgetGoals={budgetGoals}
          savingsGoals={savingsGoals}
          onEditBudget={handleEditBudget}
          onEditSavings={handleEditSavings}
          onDeleteBudget={handleDeleteBudget}
          onDeleteSavings={handleDeleteSavings}
        />
      </div>

      {/* Spending Chart */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Over Time</h2>
          <div className="flex gap-1 sm:gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <SpendingOverTimeChart data={spending?.spendingData || []} height={300} />
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Spending by Category
          </h2>
          <CategoryBreakdownChart
            data={spending?.categoryBreakdown || []}
            height={300}
          />
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top Categories
          </h2>
          {spending?.categoryBreakdown && spending.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {spending.categoryBreakdown.slice(0, 8).map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.category}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
          )}
        </div>
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        editingBudget={editingBudget}
      />
    </div>
  );
}
