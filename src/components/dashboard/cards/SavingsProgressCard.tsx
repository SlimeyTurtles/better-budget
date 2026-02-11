"use client";

import { formatCurrency } from "@/lib/utils";
import { SavingsProgressData } from "@/types/dashboard";

interface SavingsProgressCardProps {
  data: SavingsProgressData;
}

export function SavingsProgressCard({ data }: SavingsProgressCardProps) {
  const isComplete = data.progressPercent >= 100;
  const displayPercent = Math.min(Math.round(data.progressPercent), 100);
  const remainingAmount = Math.max(0, data.targetAmount - data.currentAmount);

  const getBgColor = () => {
    if (isComplete) return "bg-emerald-500";
    if (data.progressPercent >= 75) return "bg-teal-500";
    if (data.progressPercent >= 50) return "bg-cyan-500";
    if (data.progressPercent >= 25) return "bg-sky-500";
    return "bg-blue-500";
  };

  return (
    <div className={`rounded-xl p-5 shadow-lg text-white ${getBgColor()} h-full flex flex-col`}>
      {/* Main message */}
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90 truncate">{data.name}</p>
        <p className="text-3xl font-bold mt-1">
          {formatCurrency(data.currentAmount)}
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          {isComplete ? "Goal reached!" : `of ${formatCurrency(data.targetAmount)} saved`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="opacity-80">{displayPercent}% complete</span>
          {!isComplete && (
            <span className="opacity-80">{formatCurrency(remainingAmount)} to go</span>
          )}
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${displayPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
