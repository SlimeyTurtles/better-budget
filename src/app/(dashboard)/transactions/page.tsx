"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: string;
  date: string;
  name: string;
  merchantName: string | null;
  category: string | null;
  isIncome: boolean;
  isPending: boolean;
  bankAccount: {
    name: string;
    mask: string | null;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const response = await fetch("/api/transactions?limit=100");
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "income") return t.isIncome;
    if (filter === "expense") return !t.isIncome;
    return true;
  });

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your transaction history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-600">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(summary.income)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-600">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-600">Net</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              summary.income - summary.expenses >= 0
                ? "text-green-600"
                : "text-red-600"
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
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setFilter("income")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "income"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setFilter("expense")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "expense"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <p className="text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <ul className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.isIncome || Number(transaction.amount) < 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.isIncome || Number(transaction.amount) < 0 ? (
                        <ArrowDownIcon />
                      ) : (
                        <ArrowUpIcon />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.merchantName || transaction.name}
                        {transaction.isPending && (
                          <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.date)} • {transaction.bankAccount.name}
                        {transaction.category && ` • ${transaction.category}`}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      transaction.isIncome || Number(transaction.amount) < 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.isIncome || Number(transaction.amount) < 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(Number(transaction.amount)))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
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
