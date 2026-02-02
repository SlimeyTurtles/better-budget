"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  amount: string;
  date: string;
  name: string;
  category: string | null;
  isIncome: boolean;
}

interface BudgetGoal {
  id: string;
  category: string;
  periodAmount: number;
  isActive: boolean;
}

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (id: string) => void;
}

// Fallback categories if no budget goals exist
const FALLBACK_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investment",
  "Refund",
  "Other Income",
];

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
}: EditTransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    date: "",
    category: "",
    isIncome: false,
  });

  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        name: transaction.name,
        amount: Math.abs(Number(transaction.amount)).toString(),
        date: transaction.date.split("T")[0],
        category: transaction.category || "",
        isIncome: transaction.isIncome,
      });
      setShowDeleteConfirm(false);
      setError("");
      fetchBudgetGoals();
    }
  }, [transaction, isOpen]);

  async function fetchBudgetGoals() {
    try {
      const response = await fetch("/api/budget-goals");
      if (response.ok) {
        const data = await response.json();
        setBudgetGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Error fetching budget goals:", error);
    }
  }

  // Get categories based on transaction type
  const getCategories = () => {
    if (formData.isIncome) {
      return INCOME_CATEGORIES;
    }
    // For expenses, use budget goals if available, otherwise fallback
    if (budgetGoals.length > 0) {
      const budgetCategories = budgetGoals
        .filter((g) => g.isActive)
        .map((g) => g.category);
      // Add "Other" if not already in budget categories
      if (!budgetCategories.includes("Other")) {
        budgetCategories.push("Other");
      }
      return budgetCategories;
    }
    return FALLBACK_EXPENSE_CATEGORIES;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          amount: Number(formData.amount),
          date: formData.date,
          category: formData.category || null,
          isIncome: formData.isIncome,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update transaction");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete transaction");
      }

      onDelete(transaction.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isIncome: false })}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  !formData.isIncome
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isIncome: true })}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  formData.isIncome
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-8 pr-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category {!formData.isIncome && budgetGoals.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                  (from your budgets)
                </span>
              )}
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {/* Show current category if it's not in the list (e.g., from Plaid) */}
              {formData.category && !getCategories().includes(formData.category) && (
                <option value={formData.category}>
                  {formData.category} (original)
                </option>
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {showDeleteConfirm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg border border-red-300 dark:border-red-600 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
