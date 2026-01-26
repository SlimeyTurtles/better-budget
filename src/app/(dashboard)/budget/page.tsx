"use client";

import { useEffect, useState } from "react";
import { SpendingOverTimeChart } from "@/components/charts/SpendingOverTimeChart";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { formatCurrency } from "@/lib/utils";

interface SpendingData {
  spendingData: Array<{ date: string; amount: number }>;
  totalSpending: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

interface IncomeConfig {
  projectedMonthlyIncome: number;
  rentAmount: number;
  monthlySavingsGoal: number;
}

export default function BudgetPage() {
  const [spending, setSpending] = useState<SpendingData | null>(null);
  const [incomeConfig, setIncomeConfig] = useState<IncomeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    try {
      const [spendingRes, incomeRes] = await Promise.all([
        fetch(`/api/analytics/spending?period=${period}`),
        fetch("/api/income-config"),
      ]);

      const spendingData = await spendingRes.json();
      const incomeData = await incomeRes.json();

      setSpending(spendingData);
      setIncomeConfig(incomeData.config);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate budget metrics
  const monthlyIncome = incomeConfig?.projectedMonthlyIncome || 0;
  const rentAmount = incomeConfig?.rentAmount || 0;
  const savingsGoal = incomeConfig?.monthlySavingsGoal || 0;
  const totalObligations = rentAmount + savingsGoal;
  const availableBudget = monthlyIncome - totalObligations;
  const totalSpent = spending?.totalSpending || 0;
  const remaining = availableBudget - totalSpent;

  // Calculate daily/weekly allowance
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - today.getDate() + 1;
  const dailyAllowance = remaining > 0 ? remaining / daysRemaining : 0;
  const weeklyAllowance = dailyAllowance * 7;

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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Budget</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(availableBudget)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            After rent ({formatCurrency(rentAmount)}) + savings ({formatCurrency(savingsGoal)})
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spent This Month</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Safe Spending Allowance */}
      {monthlyIncome > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-6 text-white shadow">
          <h3 className="text-lg font-semibold">Safe Spending Allowance</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-green-100">Daily</p>
              <p className="text-3xl font-bold">
                {formatCurrency(dailyAllowance)}
              </p>
            </div>
            <div>
              <p className="text-green-100">Weekly</p>
              <p className="text-3xl font-bold">
                {formatCurrency(weeklyAllowance)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-green-100">
            Based on {daysRemaining} days remaining this month
          </p>
        </div>
      )}

      {/* Spending Chart */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Over Time</h2>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
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
    </div>
  );
}
