"use client";

import { CardType, CARD_REGISTRY, CardDefinition } from "@/types/dashboard";

interface BudgetGoal {
  id: string;
  category: string;
  monthlyLimit: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface CardSelectorProps {
  onSelectCard: (type: CardType, config?: { budgetGoalId?: string; savingsGoalId?: string }) => void;
  existingCardTypes: { type: CardType; configId?: string }[];
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
}

export function CardSelector({
  onSelectCard,
  existingCardTypes,
  budgetGoals,
  savingsGoals,
}: CardSelectorProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  };

  const isCardTypeAdded = (type: CardType, configId?: string): boolean => {
    return existingCardTypes.some(
      (c) => c.type === type && (!configId || c.configId === configId)
    );
  };

  const renderCardOption = (def: CardDefinition, configId?: string, configLabel?: string) => {
    const isAdded = isCardTypeAdded(def.type, configId);
    const label = configLabel ? `${def.name}: ${configLabel}` : def.name;

    return (
      <button
        key={`${def.type}-${configId || "static"}`}
        onClick={() => {
          if (!isAdded) {
            onSelectCard(def.type, configId ? {
              budgetGoalId: def.configType === "budgetGoal" ? configId : undefined,
              savingsGoalId: def.configType === "savingsGoal" ? configId : undefined,
            } : undefined);
          }
        }}
        disabled={isAdded}
        className={`w-full text-left p-3 rounded-lg border transition-all ${
          isAdded
            ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            : `${colorClasses[def.color]} hover:shadow-md cursor-pointer`
        }`}
      >
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs opacity-75 mt-0.5">{def.description}</div>
        {isAdded && (
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">Already added</div>
        )}
      </button>
    );
  };

  // Get static cards (ones that don't require config)
  const staticCards = Object.values(CARD_REGISTRY).filter((def) => !def.requiresConfig);

  return (
    <div className="space-y-6">
      {/* Static Cards */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Overview Cards
        </h4>
        <div className="space-y-2">
          {staticCards.map((def) => renderCardOption(def))}
        </div>
      </div>

      {/* Budget Remaining Cards */}
      {budgetGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Budget Category Cards
          </h4>
          <div className="space-y-2">
            {budgetGoals.map((goal) =>
              renderCardOption(
                CARD_REGISTRY.BUDGET_REMAINING,
                goal.id,
                goal.category
              )
            )}
          </div>
        </div>
      )}

      {/* Savings Progress Cards */}
      {savingsGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Savings Goal Cards
          </h4>
          <div className="space-y-2">
            {savingsGoals
              .filter((goal) => goal.name !== "Emergency Fund")
              .map((goal) =>
                renderCardOption(
                  CARD_REGISTRY.SAVINGS_PROGRESS,
                  goal.id,
                  goal.name
                )
              )}
          </div>
        </div>
      )}

      {/* Empty states */}
      {budgetGoals.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="font-medium">No budget categories yet</p>
          <p className="text-xs mt-1">Create spending budgets on the Budget page to add them here.</p>
        </div>
      )}

      {savingsGoals.filter((g) => g.name !== "Emergency Fund").length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="font-medium">No custom savings goals yet</p>
          <p className="text-xs mt-1">Create savings goals on the Budget page to add them here.</p>
        </div>
      )}
    </div>
  );
}
