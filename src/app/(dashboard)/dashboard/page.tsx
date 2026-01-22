"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { MonthlyBudgetChart } from "@/components/charts/MonthlyBudgetChart";
import { BudgetProjectionLineChart } from "@/components/charts/BudgetProjectionLineChart";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: string;
}

interface TrendlineDataPoint {
  date: string;
  unit: number;
  label: string;
  income: number;
  rent: number;
  savings: number;
  actual: number | null;
}

type TimePeriod = "daily" | "weekly" | "biweekly" | "monthly";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trendlineData, setTrendlineData] = useState<TrendlineDataPoint[]>([]);
  const [currentUnit, setCurrentUnit] = useState(1);
  const [totalUnits, setTotalUnits] = useState(1);
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [budgetTargets, setBudgetTargets] = useState({
    income: 0,
    rent: 0,
    savings: 0,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlySpending: 0,
    availableToday: 0,
    dailyIncome: 0,
    todaySpending: 0,
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    try {
      const [accountsRes, configRes, budgetRes, spendingRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/income-config"),
        fetch(`/api/analytics/monthly-budget?period=${period}`),
        fetch("/api/analytics/spending?period=monthly"),
      ]);

      const accountsData = await accountsRes.json();
      const configData = await configRes.json();
      const budgetData = await budgetRes.json();
      const spendingData = await spendingRes.json();

      setAccounts(accountsData.accounts || []);

      // Show onboarding if not completed
      if (!configData.onboardingComplete) {
        setShowOnboarding(true);
      }

      setTrendlineData(budgetData.trendlineData || []);
      setCurrentUnit(budgetData.currentUnit || 1);
      setTotalUnits(budgetData.totalUnits || 1);
      setBudgetTargets(budgetData.targets || { income: 0, rent: 0, savings: 0 });

      // Calculate stats
      setStats({
        monthlySpending: spendingData.totalSpending || 0,
        availableToday: budgetData.availableToday || 0,
        dailyIncome: budgetData.dailyIncome || 0,
        todaySpending: budgetData.todaySpending || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    fetchData(); // Refresh data after onboarding
  }

  // Calculate totals from accounts
  const totals = accounts.reduce(
    (acc, account) => {
      const balance = Number(account.currentBalance || 0);
      if (account.type === "CREDIT" || account.type === "LOAN") {
        acc.liabilities += Math.abs(balance);
      } else {
        acc.assets += balance;
      }
      return acc;
    },
    { assets: 0, liabilities: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h2>
          <p className="mt-1 text-gray-600">
            Here&apos;s an overview of your finances.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value={formatCurrency(totals.assets - totals.liabilities)}
            description="Across all accounts"
            color="blue"
          />
          <StatCard
            title="Monthly Spending"
            value={formatCurrency(stats.monthlySpending)}
            description="This month"
            color="red"
          />
          <AvailableTodayCard
            availableToday={stats.availableToday}
            dailyIncome={stats.dailyIncome}
            todaySpending={stats.todaySpending}
          />
          <StatCard
            title="Net Worth"
            value={formatCurrency(totals.assets - totals.liabilities)}
            description="Assets - Liabilities"
            color="purple"
          />
        </div>

        {/* Budget Trendlines Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Budget Progress
              </h3>
              <p className="text-sm text-gray-600">
                Track your spending against income, rent/utilities, and savings goals
              </p>
            </div>
            {/* Period Selector */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["daily", "weekly", "biweekly", "monthly"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    period === p
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {p === "biweekly" ? "2 Week" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {trendlineData.length > 0 ? (
            <>
              <MonthlyBudgetChart
                data={trendlineData}
                currentUnit={currentUnit}
                period={period}
                height={350}
              />
              {/* Budget Projection Chart */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="mb-4 text-sm font-medium text-gray-700">Balance Projection</h4>
                <BudgetProjectionLineChart
                  trendlineData={trendlineData}
                  currentUnit={currentUnit}
                  totalUnits={totalUnits}
                  rentUtilities={budgetTargets.rent}
                  savingsTarget={budgetTargets.savings}
                  incomePerUnit={budgetTargets.income / totalUnits}
                  height={250}
                />
              </div>
            </>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-gray-500">
              No budget data available. Complete onboarding to set up your income and goals.
            </div>
          )}
        </div>

        {/* Connect Bank CTA - Only show if no accounts */}
        {accounts.length === 0 && (
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow">
            <h3 className="text-lg font-semibold">Connect Your Bank Account</h3>
            <p className="mt-1 text-blue-100">
              Link your bank accounts to automatically track your transactions and see your complete financial picture.
            </p>
            <Link
              href="/accounts"
              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Connect Account
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            {accounts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                No transactions yet. Connect a bank account to see your transactions.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                View and manage your transaction history.
              </p>
            )}
            <Link
              href="/transactions"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all transactions &rarr;
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Budget & Spending</h3>
            <p className="mt-2 text-sm text-gray-500">
              Track your spending against your budget and see category breakdowns.
            </p>
            <Link
              href="/budget"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View budget &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: "blue" | "red" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className={`inline-flex rounded-lg p-2 ${colorClasses[color]}`}>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function AvailableTodayCard({
  availableToday,
  dailyIncome,
  todaySpending,
}: {
  availableToday: number;
  dailyIncome: number;
  todaySpending: number;
}) {
  const isPositive = availableToday >= 0;
  const colorClass = isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";
  const valueColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className={`inline-flex rounded-lg p-2 ${colorClass}`}>
        <span className="text-sm font-medium">Available Today</span>
      </div>
      <p className={`mt-4 text-2xl font-bold ${valueColor}`}>
        {formatCurrency(availableToday)}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {formatCurrency(dailyIncome)} daily - {formatCurrency(todaySpending)} spent
      </p>
    </div>
  );
}
