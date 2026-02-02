"use client";

import { formatCurrency } from "@/lib/utils";

interface BudgetCircleCardProps {
  name: string;
  allocated: number;
  spent: number;
  periodLabel?: string;
  color?: "blue" | "purple" | "emerald" | "orange" | "red";
  isFixedExpense?: boolean;
}

export function BudgetCircleCard({
  name,
  allocated,
  spent,
  periodLabel,
  color = "purple",
  isFixedExpense = false,
}: BudgetCircleCardProps) {
  const remaining = allocated - spent;
  const percentUsed = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const isOverBudget = spent > allocated;
  const isWarning = percentUsed >= 80 && percentUsed <= 100;

  // SVG circle properties
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percentUsed, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Color classes based on status
  const getProgressColor = () => {
    if (isFixedExpense) return "stroke-blue-500";
    if (isOverBudget) return "stroke-red-500";
    if (isWarning) return "stroke-yellow-500";
    switch (color) {
      case "blue": return "stroke-blue-500";
      case "emerald": return "stroke-emerald-500";
      case "orange": return "stroke-orange-500";
      case "red": return "stroke-red-500";
      default: return "stroke-purple-500";
    }
  };

  const getTextColor = () => {
    if (isFixedExpense) return "text-blue-600 dark:text-blue-400";
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (isWarning) return "text-yellow-600 dark:text-yellow-400";
    switch (color) {
      case "blue": return "text-blue-600 dark:text-blue-400";
      case "emerald": return "text-emerald-600 dark:text-emerald-400";
      case "orange": return "text-orange-600 dark:text-orange-400";
      case "red": return "text-red-600 dark:text-red-400";
      default: return "text-purple-600 dark:text-purple-400";
    }
  };

  const getBgColor = () => {
    if (isFixedExpense) return "bg-blue-50 dark:bg-blue-900/20";
    switch (color) {
      case "blue": return "bg-blue-50 dark:bg-blue-900/20";
      case "emerald": return "bg-emerald-50 dark:bg-emerald-900/20";
      case "orange": return "bg-orange-50 dark:bg-orange-900/20";
      case "red": return "bg-red-50 dark:bg-red-900/20";
      default: return "bg-purple-50 dark:bg-purple-900/20";
    }
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col items-center">
        {/* Circle Progress */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-500 ${getProgressColor()}`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getTextColor()}`}>
              {percentUsed}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">used</span>
          </div>
        </div>

        {/* Label */}
        <div className="mt-3 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {name}
          </h3>
          {periodLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getBgColor()} ${getTextColor()} font-medium`}>
              {periodLabel}
            </span>
          )}
        </div>

        {/* Amounts */}
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className={`font-semibold ${getTextColor()}`}>
              {formatCurrency(spent)}
            </span>
            {" / "}
            {formatCurrency(allocated)}
          </p>
          <p className={`text-xs mt-1 ${
            isOverBudget
              ? "text-red-600 dark:text-red-400"
              : remaining > 0
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
          }`}>
            {isOverBudget
              ? `${formatCurrency(Math.abs(remaining))} over`
              : `${formatCurrency(remaining)} left`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
