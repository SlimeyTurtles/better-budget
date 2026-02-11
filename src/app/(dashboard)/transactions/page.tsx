"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { EditTransactionModal } from "@/components/transactions/EditTransactionModal";
import { TagBadge } from "@/components/ui/TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  isSystem?: boolean;
}

interface Transaction {
  id: string;
  amount: string;
  date: string;
  name: string;
  merchantName: string | null;
  category: string | null;
  isIncome: boolean;
  isPending: boolean;
  isManual: boolean;
  tags: Tag[];
  bankAccount: {
    name: string;
    mask: string | null;
  };
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

function getMonthName(): string {
  return new Date().toLocaleString("default", { month: "long" });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showAllTime, setShowAllTime] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ limit: "500" });
      if (!showAllTime) {
        params.set("startDate", getStartOfMonth());
      }
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showAllTime]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "income") return t.isIncome;
    if (filter === "expense") return !t.isIncome;
    return true;
  });

  function handleDeleteTransaction(id: string) {
    setTransactions(transactions.filter((t) => t.id !== id));
  }

  // Calculate summary
  const summary = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount);
      if (t.isIncome || amount < 0) {
        acc.income += Math.abs(amount);
      } else {
        acc.expenses += amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {showAllTime ? "All Transactions" : `${getMonthName()} Transactions`}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {showAllTime
              ? "Viewing all transaction history"
              : `Showing transactions from ${getMonthName()} ${new Date().getFullYear()}`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAllTime(!showAllTime)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 sm:flex-initial"
          >
            {showAllTime ? (
              <>
                <CalendarIcon />
                This Month
              </>
            ) : (
              <>
                <HistoryIcon />
                View All
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex-1 sm:flex-initial"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.income)}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              summary.income - summary.expenses >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(summary.income - summary.expenses)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setFilter("income")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "income"
              ? "bg-green-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setFilter("expense")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "expense"
              ? "bg-red-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        transaction.isIncome || Number(transaction.amount) < 0
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.isIncome || Number(transaction.amount) < 0 ? (
                        <ArrowDownIcon />
                      ) : (
                        <ArrowUpIcon />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {transaction.merchantName || transaction.name}
                        {transaction.isPending && (
                          <span className="ml-2 rounded bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-800 dark:text-yellow-400">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {formatDate(transaction.date)} • {transaction.bankAccount.name}
                      </p>
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.tags.map((tag) => (
                            <TagBadge key={tag.id} tag={tag} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <p
                      className={`text-base sm:text-lg font-semibold whitespace-nowrap ${
                        transaction.isIncome || Number(transaction.amount) < 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.isIncome || Number(transaction.amount) < 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(Number(transaction.amount)))}
                    </p>
                    {transaction.isManual && (
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit transaction"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        onSuccess={fetchTransactions}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
