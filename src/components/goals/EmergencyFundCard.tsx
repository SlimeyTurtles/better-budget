"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface EmergencyFundCardProps {
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  daysUntilGoal: number | null;
  dailySavingsRate: number;
  onUpdate?: (currentAmount: number, targetAmount: number) => void;
}

export function EmergencyFundCard({
  targetAmount,
  currentAmount,
  progressPercent,
  daysUntilGoal,
  dailySavingsRate,
  onUpdate,
}: EmergencyFundCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCurrentAmount, setEditCurrentAmount] = useState(currentAmount.toString());
  const [editTargetAmount, setEditTargetAmount] = useState(targetAmount.toString());
  const [isSaving, setIsSaving] = useState(false);

  const isComplete = progressPercent >= 100;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newCurrent = parseFloat(editCurrentAmount) || 0;
      const newTarget = parseFloat(editTargetAmount) || 1000;

      const res = await fetch("/api/savings-goals/emergency-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAmount: newCurrent,
          targetAmount: newTarget,
        }),
      });

      if (res.ok && onUpdate) {
        onUpdate(newCurrent, newTarget);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update emergency fund:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDaysUntilGoal = () => {
    if (isComplete) return "Goal reached!";
    if (daysUntilGoal === null) return "Set savings goal to track";
    if (daysUntilGoal <= 0) return "Goal reached!";
    if (daysUntilGoal === 1) return "1 day until goal";
    if (daysUntilGoal < 30) return `${daysUntilGoal} days until goal`;
    if (daysUntilGoal < 60) return `${Math.round(daysUntilGoal / 7)} weeks until goal`;
    return `${Math.round(daysUntilGoal / 30)} months until goal`;
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-2 text-emerald-600 dark:text-emerald-400">
          <span className="text-sm font-medium">Emergency Fund</span>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              setEditCurrentAmount(currentAmount.toString());
              setEditTargetAmount(targetAmount.toString());
            }
            setIsEditing(!isEditing);
          }}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {isEditing ? (
          <div className="mt-4 space-y-3 flex-1 flex flex-col justify-center">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current Amount</label>
              <input
                type="number"
                value={editCurrentAmount}
                onChange={(e) => setEditCurrentAmount(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Target Amount</label>
              <input
                type="number"
                value={editTargetAmount}
                onChange={(e) => setEditTargetAmount(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                placeholder="1000"
                min="1"
                step="0.01"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <>
            {/* Progress amount */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentAmount)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {formatCurrency(targetAmount)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-auto pt-3">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? "bg-emerald-500"
                      : progressPercent >= 75
                      ? "bg-emerald-400"
                      : progressPercent >= 50
                      ? "bg-yellow-400"
                      : progressPercent >= 25
                      ? "bg-orange-400"
                      : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{progressPercent}% complete</span>
                <span>{formatCurrency(Math.max(0, targetAmount - currentAmount))} to go</span>
              </div>
            </div>

            {/* Days until goal */}
            <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className={`text-sm font-medium ${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                {formatDaysUntilGoal()}
              </p>
              {!isComplete && dailySavingsRate > 0 && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  at {formatCurrency(dailySavingsRate)}/day savings rate
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
