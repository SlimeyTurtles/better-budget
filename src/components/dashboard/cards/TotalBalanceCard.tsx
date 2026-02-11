"use client";

import { formatCurrency } from "@/lib/utils";
import { TotalBalanceData } from "@/types/dashboard";

interface TotalBalanceCardProps {
  data: TotalBalanceData;
}

export function TotalBalanceCard({ data }: TotalBalanceCardProps) {
  const netBalance = data.assets - data.liabilities;
  const isPositive = netBalance >= 0;
  const hasLiabilities = data.liabilities > 0;

  // Calculate the visual ratio for the bar
  const total = data.assets + data.liabilities;
  const assetsPercent = total > 0 ? (data.assets / total) * 100 : 100;

  return (
    <div className={`rounded-xl p-5 shadow-lg h-full flex flex-col text-white ${
      isPositive ? "bg-blue-500" : "bg-red-500"
    }`}>
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">Your net worth</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(netBalance)}</p>
        {!isPositive && (
          <p className="text-sm opacity-90 mt-0.5">in debt</p>
        )}
      </div>

      {/* Assets vs Liabilities bar */}
      {hasLiabilities ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="opacity-80">{formatCurrency(data.assets)} assets</span>
            <span className="opacity-80">{formatCurrency(data.liabilities)} debt</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-white/80 transition-all duration-500"
              style={{ width: `${assetsPercent}%` }}
            />
            <div
              className="h-full bg-red-300/60 transition-all duration-500"
              style={{ width: `${100 - assetsPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs opacity-70">
            No debt - all {formatCurrency(data.assets)} in assets
          </p>
        </div>
      )}
    </div>
  );
}
