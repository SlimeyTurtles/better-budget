"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { MonthlyBudgetChart } from "@/components/charts/MonthlyBudgetChart";
import { BudgetProjectionLineChart } from "@/components/charts/BudgetProjectionLineChart";
import { DraggableCardGrid, AddCardPopup } from "@/components/dashboard";
import {
  DashboardCardConfig,
  DEFAULT_DASHBOARD_CARDS,
  CardType,
  CardData,
} from "@/types/dashboard";

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

interface BudgetGoal {
  id: string;
  category: string;
  periodType: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  periodAmount: number;
  currentSpending?: number;
  remaining?: number;
  percentUsed?: number;
  daysRemainingInPeriod?: number;
  dailyAllowance?: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent?: number;
  targetDate?: string | null;
  daysUntilDeadline?: number | null;
  daysUntilGoal?: number | null;
  contributionNeeded?: number | null;
  monthlyContributionNeeded?: number | null;
  isOnTrack?: boolean;
}

type TimePeriod = "daily" | "weekly" | "biweekly" | "monthly";

export default function DashboardPage() {
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
    availablePerDay: 0,
    availableToSpendTotal: 0,
    todaySpending: 0,
  });
  const [emergencyFund, setEmergencyFund] = useState({
    targetAmount: 1000,
    currentAmount: 0,
    progressPercent: 0,
    daysUntilGoal: null as number | null,
    dailySavingsRate: 0,
  });

  // Dashboard configuration state
  const [dashboardCards, setDashboardCards] = useState<DashboardCardConfig[]>(DEFAULT_DASHBOARD_CARDS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<{
    totalMonthlyIncome: number;
    totalBudgetAllocations: number;
    remainingDiscretionary: number;
    dailyDiscretionary: number;
    totalCurrentSpending: number;
    isOverAllocated: boolean;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [
        accountsRes,
        configRes,
        budgetRes,
        spendingRes,
        emergencyFundRes,
        dashboardConfigRes,
        savingsGoalsRes,
        budgetSummaryRes,
      ] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/income-config"),
        fetch(`/api/analytics/monthly-budget?period=${period}`),
        fetch("/api/analytics/spending?period=monthly"),
        fetch("/api/savings-goals/emergency-fund"),
        fetch("/api/dashboard-config"),
        fetch("/api/savings-goals"),
        fetch("/api/analytics/budget-summary"),
      ]);

      const accountsData = await accountsRes.json();
      const configData = await configRes.json();
      const budgetData = await budgetRes.json();
      const spendingData = await spendingRes.json();
      const emergencyFundData = await emergencyFundRes.json();
      const dashboardConfigData = await dashboardConfigRes.json();
      const savingsGoalsData = await savingsGoalsRes.json();
      const budgetSummaryData = await budgetSummaryRes.json();

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
        availablePerDay: budgetData.availablePerDay || 0,
        availableToSpendTotal: budgetData.availableToSpendTotal || 0,
        todaySpending: budgetData.todaySpending || 0,
      });

      // Set emergency fund data
      setEmergencyFund({
        targetAmount: emergencyFundData.targetAmount || 1000,
        currentAmount: emergencyFundData.currentAmount || 0,
        progressPercent: emergencyFundData.progressPercent || 0,
        daysUntilGoal: emergencyFundData.daysUntilGoal,
        dailySavingsRate: emergencyFundData.dailySavingsRate || 0,
      });

      // Set dashboard configuration
      setDashboardCards(dashboardConfigData.cards || DEFAULT_DASHBOARD_CARDS);

      // Set budget goals directly from budget summary (it already has spending data)
      setBudgetGoals(budgetSummaryData.goals || []);

      // Set savings goals
      setSavingsGoals(savingsGoalsData.goals || []);

      // Set budget summary totals
      if (budgetSummaryData.summary) {
        setBudgetSummary({
          totalMonthlyIncome: budgetSummaryData.summary.totalMonthlyIncome,
          totalBudgetAllocations: budgetSummaryData.summary.totalBudgetAllocations,
          remainingDiscretionary: budgetSummaryData.summary.remainingDiscretionary,
          dailyDiscretionary: budgetSummaryData.summary.dailyDiscretionary,
          totalCurrentSpending: budgetSummaryData.summary.totalCurrentSpending,
          isOverAllocated: budgetSummaryData.summary.isOverAllocated,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    fetchData();
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

  // Build card data map for all card types
  const cardDataMap: Partial<Record<string, CardData["data"]>> = {
    TOTAL_BALANCE: {
      assets: totals.assets,
      liabilities: totals.liabilities,
      netBalance: totals.assets - totals.liabilities,
    },
    MONTHLY_SPENDING: { totalSpending: stats.monthlySpending },
    AVAILABLE_TODAY: {
      availableToday: stats.availableToday,
      availablePerDay: stats.availablePerDay,
      availableToSpendTotal: stats.availableToSpendTotal,
      todaySpending: stats.todaySpending,
    },
    TOTAL_EXPENSES: { totalExpenses: stats.monthlySpending },
    EMERGENCY_FUND: {
      targetAmount: emergencyFund.targetAmount,
      currentAmount: emergencyFund.currentAmount,
      progressPercent: emergencyFund.progressPercent,
      daysUntilGoal: emergencyFund.daysUntilGoal,
      dailySavingsRate: emergencyFund.dailySavingsRate,
    },
    BUDGET_TOTAL_REMAINING: budgetSummary
      ? {
          totalMonthlyIncome: budgetSummary.totalMonthlyIncome,
          totalBudgetAllocations: budgetSummary.totalBudgetAllocations,
          remainingDiscretionary: budgetSummary.remainingDiscretionary,
          dailyDiscretionary: budgetSummary.dailyDiscretionary,
          totalCurrentSpending: budgetSummary.totalCurrentSpending,
          percentUsed: budgetSummary.totalBudgetAllocations > 0
            ? Math.round((budgetSummary.totalCurrentSpending / budgetSummary.totalBudgetAllocations) * 100)
            : 0,
          isOverAllocated: budgetSummary.isOverAllocated,
        }
      : { totalMonthlyIncome: 0, totalBudgetAllocations: 0, remainingDiscretionary: 0, dailyDiscretionary: 0, totalCurrentSpending: 0, percentUsed: 0, isOverAllocated: false },
  };

  // Add budget goal data
  budgetGoals.forEach((goal) => {
    cardDataMap[`budget-${goal.id}`] = {
      category: goal.category,
      periodType: goal.periodType,
      periodAmount: goal.periodAmount,
      currentSpending: goal.currentSpending || 0,
      remaining: goal.remaining || goal.periodAmount,
      percentUsed: goal.percentUsed || 0,
      daysRemainingInPeriod: goal.daysRemainingInPeriod,
      dailyAllowance: goal.dailyAllowance,
    };
  });

  // Add savings goal data
  savingsGoals.forEach((goal) => {
    cardDataMap[`savings-${goal.id}`] = {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progressPercent: goal.progressPercent || 0,
      targetDate: goal.targetDate,
      daysUntilDeadline: goal.daysUntilDeadline,
      daysUntilGoal: goal.daysUntilGoal,
      contributionNeeded: goal.contributionNeeded,
      monthlyContributionNeeded: goal.monthlyContributionNeeded,
      isOnTrack: goal.isOnTrack,
    };
  });

  // Handle card changes (reorder)
  const handleCardsChange = async (newCards: DashboardCardConfig[]) => {
    setDashboardCards(newCards);
    try {
      await fetch("/api/dashboard-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: newCards }),
      });
    } catch (error) {
      console.error("Error saving dashboard config:", error);
    }
  };

  // Handle card removal
  const handleRemoveCard = async (cardId: string) => {
    const newCards = dashboardCards
      .filter((c) => c.id !== cardId)
      .map((c, i) => ({ ...c, position: i }));
    await handleCardsChange(newCards);
  };

  // Handle adding a new card
  const handleAddCard = async (
    type: CardType,
    config?: { budgetGoalId?: string; savingsGoalId?: string }
  ) => {
    const newCard: DashboardCardConfig = {
      id: `card-${Date.now()}`,
      type,
      position: dashboardCards.length,
      config,
    };
    const newCards = [...dashboardCards, newCard];
    await handleCardsChange(newCards);
  };

  // Handle emergency fund update
  const handleEmergencyFundUpdate = (currentAmount: number, targetAmount: number) => {
    setEmergencyFund((prev) => ({
      ...prev,
      currentAmount,
      targetAmount,
      progressPercent: targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0,
    }));
    fetchData();
  };

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
        {/* Dashboard Header with Edit Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your financial overview at a glance
            </p>
          </div>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditMode
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {isEditMode ? "Done" : "Edit"}
          </button>
        </div>

        {/* Configurable Quick Stats Cards */}
        <DraggableCardGrid
          cards={dashboardCards}
          cardDataMap={cardDataMap}
          isEditMode={isEditMode}
          onCardsChange={handleCardsChange}
          onRemoveCard={handleRemoveCard}
          onEmergencyFundUpdate={handleEmergencyFundUpdate}
        />

        {/* Budget Trendlines Chart */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Budget Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your spending against income, rent/utilities, and savings goals
              </p>
            </div>
            {/* Period Selector */}
            <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {(["daily", "weekly", "biweekly", "monthly"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    period === p
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
                incomePerUnit={budgetTargets.income / totalUnits}
                height={350}
              />
              {/* Budget Projection Chart */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Balance Projection</h4>
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
            <div className="flex h-[350px] items-center justify-center text-gray-500 dark:text-gray-400">
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
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            {accounts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No transactions yet. Connect a bank account to see your transactions.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                View and manage your transaction history.
              </p>
            )}
            <Link
              href="/transactions"
              className="mt-4 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              View all transactions &rarr;
            </Link>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget & Spending</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Track your spending against your budget and see category breakdowns.
            </p>
            <Link
              href="/budget"
              className="mt-4 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              View budget &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Add Card Button */}
      <AddCardPopup
        isEditMode={isEditMode}
        budgetGoals={budgetGoals}
        savingsGoals={savingsGoals}
        existingCardTypes={dashboardCards.map((card) => ({
          type: card.type,
          configId: card.config?.budgetGoalId || card.config?.savingsGoalId,
        }))}
        onAddCard={handleAddCard}
      />
    </>
  );
}
