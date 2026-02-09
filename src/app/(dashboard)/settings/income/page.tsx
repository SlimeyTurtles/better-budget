"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface IncomeConfig {
  projectedMonthlyIncome: number;
  payFrequency: "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";
  nextPayDate?: string;
  rentAmount: number;
  utilitiesAmount: number;
  rentDueDay: number;
  monthlySavingsGoal: number;
  savingsIsPercent: boolean;
}

export default function IncomeSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [config, setConfig] = useState<IncomeConfig>({
    projectedMonthlyIncome: 0,
    payFrequency: "MONTHLY",
    nextPayDate: "",
    rentAmount: 0,
    utilitiesAmount: 0,
    rentDueDay: 1,
    monthlySavingsGoal: 0,
    savingsIsPercent: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch("/api/income-config");
      const data = await response.json();
      if (data.config) {
        setConfig({
          ...data.config,
          nextPayDate: data.config.nextPayDate
            ? data.config.nextPayDate.split("T")[0]
            : "",
        });
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/income-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  // Calculate derived values
  const monthlyIncome = config.projectedMonthlyIncome;
  const savingsAmount = config.savingsIsPercent
    ? (monthlyIncome * config.monthlySavingsGoal) / 100
    : config.monthlySavingsGoal;
  const totalObligations = config.rentAmount + config.utilitiesAmount + savingsAmount;
  const discretionaryIncome = monthlyIncome - totalObligations;
  const dailyBudget = discretionaryIncome / 30;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income Configuration</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Set up your income and monthly obligations for budget projections
        </p>
      </div>

      {/* Preview Card */}
      {monthlyIncome > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow">
          <h3 className="text-lg font-semibold">Monthly Summary</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-blue-100">Income</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-blue-100">Obligations</p>
              <p className="text-2xl font-bold">{formatCurrency(totalObligations)}</p>
            </div>
            <div>
              <p className="text-blue-100">Daily Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(dailyBudget)}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-red-600 dark:text-red-400">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 text-green-600 dark:text-green-400">
            Settings saved successfully!
          </div>
        )}

        {/* Income Section */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Income</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly Income
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  value={config.projectedMonthlyIncome || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      projectedMonthlyIncome: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-8 pr-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your projected monthly income for amortized calculations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pay Frequency
              </label>
              <select
                value={config.payFrequency}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    payFrequency: e.target.value as IncomeConfig["payFrequency"],
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-weekly</option>
                <option value="SEMIMONTHLY">Semi-monthly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Next Pay Date
              </label>
              <input
                type="date"
                value={config.nextPayDate || ""}
                onChange={(e) =>
                  setConfig({ ...config, nextPayDate: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Obligations Section */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Obligations
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rent / Housing
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  value={config.rentAmount || ""}
                  onChange={(e) =>
                    setConfig({ ...config, rentAmount: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-8 pr-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="1500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Utilities
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  value={config.utilitiesAmount || ""}
                  onChange={(e) =>
                    setConfig({ ...config, utilitiesAmount: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-8 pr-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Electric, water, internet, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rent Due Day
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={config.rentDueDay || ""}
                onChange={(e) =>
                  setConfig({ ...config, rentDueDay: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly Savings Goal
              </label>
              <div className="mt-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">
                    {config.savingsIsPercent ? "%" : "$"}
                  </span>
                  <input
                    type="number"
                    value={config.monthlySavingsGoal || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        monthlySavingsGoal: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-8 pr-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={config.savingsIsPercent ? "10" : "500"}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, savingsIsPercent: !config.savingsIsPercent })
                  }
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    config.savingsIsPercent
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {config.savingsIsPercent ? "%" : "$"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {config.savingsIsPercent
                  ? `${config.monthlySavingsGoal}% = ${formatCurrency(savingsAmount)}/month`
                  : "Amount you want to save each month"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
