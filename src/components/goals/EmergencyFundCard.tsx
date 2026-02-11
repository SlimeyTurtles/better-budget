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
  // dailySavingsRate kept in interface for compatibility but not displayed
  onUpdate,
}: EmergencyFundCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCurrentAmount, setEditCurrentAmount] = useState(currentAmount.toString());
  const [editTargetAmount, setEditTargetAmount] = useState(targetAmount.toString());
  const [isSaving, setIsSaving] = useState(false);

  const isComplete = progressPercent >= 100;
  const displayPercent = Math.min(Math.round(progressPercent), 100);
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

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
    if (daysUntilGoal === 1) return "1 day left";
    if (daysUntilGoal < 30) return `${daysUntilGoal} days left`;
    if (daysUntilGoal < 60) return `${Math.round(daysUntilGoal / 7)} weeks left`;
    return `${Math.round(daysUntilGoal / 30)} months left`;
  };

  const getBgColor = () => {
    if (isComplete) return "bg-emerald-500";
    if (progressPercent >= 75) return "bg-teal-500";
    if (progressPercent >= 50) return "bg-amber-500";
    if (progressPercent >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={`rounded-xl p-5 shadow-lg text-white ${getBgColor()} h-full flex flex-col`}>
      {isEditing ? (
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-90">Emergency Fund</p>
            <button
              onClick={() => {
                setEditCurrentAmount(currentAmount.toString());
                setEditTargetAmount(targetAmount.toString());
                setIsEditing(false);
              }}
              className="text-xs opacity-80 hover:opacity-100"
            >
              Cancel
            </button>
          </div>
          <div>
            <label className="block text-xs opacity-70 mb-1">Current Amount</label>
            <input
              type="number"
              value={editCurrentAmount}
              onChange={(e) => setEditCurrentAmount(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-white/50 focus:outline-none"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs opacity-70 mb-1">Target Amount</label>
            <input
              type="number"
              value={editTargetAmount}
              onChange={(e) => setEditTargetAmount(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-white/50 focus:outline-none"
              placeholder="1000"
              min="1"
              step="0.01"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <>
          {/* Main message */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium opacity-90">Emergency Fund</p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs opacity-70 hover:opacity-100 underline"
              >
                Edit
              </button>
            </div>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(currentAmount)}
            </p>
            <p className="text-sm opacity-90 mt-0.5">
              {isComplete ? "Goal reached!" : `of ${formatCurrency(targetAmount)} saved`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="opacity-80">{displayPercent}% complete</span>
              {!isComplete && (
                <span className="opacity-80">{formatDaysUntilGoal()}</span>
              )}
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            {!isComplete && remainingAmount > 0 && (
              <p className="text-xs opacity-70 mt-2">
                {formatCurrency(remainingAmount)} to go
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
