"use client";

import { useState, useEffect } from "react";

type BudgetType = "spending" | "savings";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: BudgetType;
    category?: string;
    name?: string;
    monthlyLimit?: number;
    targetAmount?: number;
    currentAmount?: number;
  }) => Promise<void>;
  editingBudget?: {
    id: string;
    type: BudgetType;
    category?: string;
    name?: string;
    monthlyLimit?: number;
    targetAmount?: number;
    currentAmount?: number;
  } | null;
}

const COMMON_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Entertainment",
  "Shopping",
  "Transportation",
  "Utilities",
  "Subscriptions",
  "Health & Fitness",
  "Personal Care",
  "Gifts",
  "Travel",
  "Education",
  "Other",
];

export function BudgetModal({ isOpen, onClose, onSave, editingBudget }: BudgetModalProps) {
  const [type, setType] = useState<BudgetType>("spending");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or editing budget changes
  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        setType(editingBudget.type);
        if (editingBudget.type === "spending") {
          const isCommon = COMMON_CATEGORIES.includes(editingBudget.category || "");
          setCategory(isCommon ? editingBudget.category || "" : "Other");
          setCustomCategory(isCommon ? "" : editingBudget.category || "");
          setAmount(editingBudget.monthlyLimit?.toString() || "");
        } else {
          setName(editingBudget.name || "");
          setAmount(editingBudget.targetAmount?.toString() || "");
          setCurrentAmount(editingBudget.currentAmount?.toString() || "0");
        }
      } else {
        setType("spending");
        setCategory("");
        setCustomCategory("");
        setName("");
        setAmount("");
        setCurrentAmount("");
      }
      setError("");
    }
  }, [isOpen, editingBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (type === "spending") {
      const finalCategory = category === "Other" ? customCategory : category;
      if (!finalCategory.trim()) {
        setError("Please select or enter a category");
        return;
      }
      setIsSubmitting(true);
      try {
        await onSave({
          type: "spending",
          category: finalCategory.trim(),
          monthlyLimit: numAmount,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save budget");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!name.trim()) {
        setError("Please enter a name for your savings goal");
        return;
      }
      const numCurrentAmount = parseFloat(currentAmount) || 0;
      setIsSubmitting(true);
      try {
        await onSave({
          type: "savings",
          name: name.trim(),
          targetAmount: numAmount,
          currentAmount: numCurrentAmount,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save savings goal");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingBudget ? "Edit Budget" : "Create Budget"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          {!editingBudget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Type
              </label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType("spending")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    type === "spending"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Spending Limit
                </button>
                <button
                  type="button"
                  onClick={() => setType("savings")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    type === "savings"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Savings Goal
                </button>
              </div>
            </div>
          )}

          {/* Spending Limit Form */}
          {type === "spending" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Category
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Savings Goal Form */}
          {type === "savings" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Vacation Fund, New Car"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Amount Saved
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : editingBudget ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
