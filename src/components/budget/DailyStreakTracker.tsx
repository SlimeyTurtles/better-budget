"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface DayStatus {
  day: number;
  date: string;
  spending: number;
  staticDailyBudget: number;
  amortizedDailyBudget: number;
  remainingDays: number;
  remainingDiscretionary: number;
  status: "gold" | "green" | "grey" | "future";
}

interface StreakData {
  days: DayStatus[];
  staticDailyBudget: number;
  totalAvailable: number;
  currentDay: number;
  daysInMonth: number;
  stats: {
    goldDays: number;
    greenDays: number;
    greyDays: number;
    currentStreak: number;
    longestStreak: number;
  };
}

interface DailyStreakTrackerProps {
  onRefresh?: () => void;
}

export function DailyStreakTracker({ onRefresh }: DailyStreakTrackerProps) {
  const [data, setData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayStatus | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch("/api/analytics/daily-streak");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching streak data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Refresh when parent triggers
  useEffect(() => {
    if (onRefresh) {
      fetchData();
    }
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return null;
  }

  const getStatusColor = (status: DayStatus["status"]) => {
    switch (status) {
      case "gold":
        // Under amortized budget - green (ideal/on track)
        return "bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-200 dark:shadow-green-900/30";
      case "green":
        // Under daily budget - yellow (okay but using buffer)
        return "bg-gradient-to-br from-yellow-300 to-amber-500 shadow-amber-200 dark:shadow-amber-900/30";
      case "grey":
        // Over budget - red
        return "bg-gradient-to-br from-red-400 to-red-600 shadow-red-200 dark:shadow-red-900/30";
      case "future":
        return "bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600";
    }
  };

  const getStatusRing = (status: DayStatus["status"], isToday: boolean) => {
    if (!isToday) return "";
    return "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800";
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Budget Streak
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Target: {formatCurrency(data.staticDailyBudget)}/day
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.currentStreak} day{data.stats.currentStreak !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              current streak
            </p>
          </div>
        </div>
      </div>

      {/* Day circles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.days.map((day) => (
          <div
            key={day.day}
            className="relative"
            onMouseEnter={() => setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                transition-all duration-200 cursor-pointer
                ${getStatusColor(day.status)}
                ${getStatusRing(day.status, day.day === data.currentDay)}
                ${day.status === "gold" ? "text-white shadow-md" : ""}
                ${day.status === "green" ? "text-amber-900 shadow-md" : ""}
                ${day.status === "grey" ? "text-white shadow-md" : ""}
                ${day.status === "future" ? "text-gray-400 dark:text-gray-500" : ""}
                hover:scale-110 hover:shadow-lg
              `}
            >
              {day.day}
            </div>

            {/* Tooltip */}
            {hoveredDay?.day === day.day && day.status !== "future" && (
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                <div className="font-medium mb-1">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div>Spent: {formatCurrency(day.spending)}</div>
                <div className="text-gray-300 dark:text-gray-400">
                  Budget: {formatCurrency(day.amortizedDailyBudget)}
                </div>
                <div className="text-gray-300 dark:text-gray-400">
                  Remaining: {formatCurrency(day.remainingDiscretionary)}
                </div>
                <div className="text-gray-300 dark:text-gray-400">
                  Days left: {day.remainingDays}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend and Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              On track ({data.stats.goldDays})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Under daily budget ({data.stats.greenDays})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Over budget ({data.stats.greyDays})
            </span>
          </div>
        </div>

        {data.stats.longestStreak > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Best streak: <span className="font-medium text-gray-900 dark:text-white">{data.stats.longestStreak} days</span>
          </div>
        )}
      </div>
    </div>
  );
}
