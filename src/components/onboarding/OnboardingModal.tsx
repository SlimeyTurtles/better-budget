"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [config, setConfig] = useState({
    projectedMonthlyIncome: 0,
    payFrequency: "BIWEEKLY" as "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY",
    rentAmount: 0,
    utilitiesAmount: 0,
    monthlySavingsGoal: 0,
    savingsIsPercent: false,
  });

  const totalSteps = 3;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/income-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          onboardingComplete: true,
          rentDueDay: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate actual savings amount for display
  const actualSavings = config.savingsIsPercent
    ? (config.projectedMonthlyIncome * config.monthlySavingsGoal) / 100
    : config.monthlySavingsGoal;

  const totalExpenses = config.rentAmount + config.utilitiesAmount + actualSavings;
  const remaining = config.projectedMonthlyIncome - totalExpenses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Income */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to Better Budget!
              </h2>
              <p className="mt-2 text-gray-600">
                Let&apos;s set up your income to get started.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Income (after taxes)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  value={config.projectedMonthlyIncome || ""}
                  onChange={(e) =>
                    setConfig({ ...config, projectedMonthlyIncome: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="5000"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                How often are you paid?
              </label>
              <select
                value={config.payFrequency}
                onChange={(e) =>
                  setConfig({ ...config, payFrequency: e.target.value as typeof config.payFrequency })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="SEMIMONTHLY">Twice a month</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Expenses */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Monthly Expenses
              </h2>
              <p className="mt-2 text-gray-600">
                Enter your fixed monthly expenses.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rent / Mortgage
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  value={config.rentAmount || ""}
                  onChange={(e) =>
                    setConfig({ ...config, rentAmount: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="1500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Utilities (electric, water, internet, etc.)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  value={config.utilitiesAmount || ""}
                  onChange={(e) =>
                    setConfig({ ...config, utilitiesAmount: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Savings */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Savings Goal
              </h2>
              <p className="mt-2 text-gray-600">
                How much do you want to save each month?
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, savingsIsPercent: false })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    !config.savingsIsPercent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Fixed Amount
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, savingsIsPercent: true })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    config.savingsIsPercent
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Percentage
                </button>
              </div>

              <div className="relative mt-1">
                <span className="absolute left-3 top-3 text-gray-500">
                  {config.savingsIsPercent ? "%" : "$"}
                </span>
                <input
                  type="number"
                  value={config.monthlySavingsGoal || ""}
                  onChange={(e) =>
                    setConfig({ ...config, monthlySavingsGoal: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={config.savingsIsPercent ? "20" : "500"}
                  autoFocus
                />
              </div>
              {config.savingsIsPercent && config.projectedMonthlyIncome > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  = {formatCurrency(actualSavings)} per month
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">Monthly Summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Income</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(config.projectedMonthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent</span>
                  <span className="text-red-600">-{formatCurrency(config.rentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilities</span>
                  <span className="text-red-600">-{formatCurrency(config.utilitiesAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Savings</span>
                  <span className="text-blue-600">-{formatCurrency(actualSavings)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Available to spend</span>
                    <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && config.projectedMonthlyIncome <= 0}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
