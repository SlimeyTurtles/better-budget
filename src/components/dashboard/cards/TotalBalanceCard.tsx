"use client";

import { formatCurrency } from "@/lib/utils";
import { TotalBalanceData } from "@/types/dashboard";

interface TotalBalanceCardProps {
  data: TotalBalanceData;
}

export function TotalBalanceCard({ data }: TotalBalanceCardProps) {
  const netBalance = data.assets - data.liabilities;

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="inline-flex rounded-lg p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        <span className="text-sm font-medium">Total Balance</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(netBalance)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Across all accounts
        </p>
      </div>
    </div>
  );
}
