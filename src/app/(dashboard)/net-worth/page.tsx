"use client";

import { useEffect, useState } from "react";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { formatCurrency } from "@/lib/utils";

interface NetWorthData {
  netWorthHistory: Array<{
    date: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  }>;
  current: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
  }>;
}

export default function NetWorthPage() {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [showComponents, setShowComponents] = useState(false);

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    try {
      const response = await fetch(`/api/analytics/net-worth?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching net worth data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createSnapshot() {
    try {
      await fetch("/api/analytics/net-worth", { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Error creating snapshot:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const { current, netWorthHistory, accounts } = data || {
    current: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 },
    netWorthHistory: [],
    accounts: [],
  };

  // Calculate change from first data point
  const firstPoint = netWorthHistory[0];
  const change = firstPoint ? current.netWorth - firstPoint.netWorth : 0;
  const changePercent = firstPoint && firstPoint.netWorth !== 0
    ? ((change / Math.abs(firstPoint.netWorth)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Net Worth</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your wealth over time
          </p>
        </div>
        <button
          onClick={createSnapshot}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Update Snapshot
        </button>
      </div>

      {/* Current Net Worth */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow md:col-span-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Net Worth</p>
          <p
            className={`mt-2 text-3xl font-bold ${
              current.netWorth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(current.netWorth)}
          </p>
          {netWorthHistory.length > 1 && (
            <p
              className={`mt-2 text-sm ${
                change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {formatCurrency(change)} ({changePercent.toFixed(1)}%) over {days} days
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(current.totalAssets)}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liabilities</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(current.totalLiabilities)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Net Worth History</h2>
          <div className="flex gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
            <button
              onClick={() => setShowComponents(!showComponents)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                showComponents
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {showComponents ? "Show Net Worth" : "Show Breakdown"}
            </button>
          </div>
        </div>
        <NetWorthChart
          data={netWorthHistory}
          height={350}
          showComponents={showComponents}
        />
      </div>

      {/* Account Breakdown */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Account Breakdown</h2>
        {accounts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No accounts connected</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      account.type === "CREDIT" || account.type === "LOAN"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{account.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({account.type.toLowerCase()})
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    account.type === "CREDIT" || account.type === "LOAN"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
