"use client";

import { useEffect, useRef } from "react";
import { CardSelector } from "./CardSelector";
import { CardType, DashboardCardConfig, CARD_REGISTRY } from "@/types/dashboard";

interface BudgetGoal {
  id: string;
  category: string;
  periodType: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  periodAmount: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface CardEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cards: DashboardCardConfig[];
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  onAddCard: (type: CardType, config?: { budgetGoalId?: string; savingsGoalId?: string }) => void;
}

export function CardEditorPanel({
  isOpen,
  onClose,
  cards,
  budgetGoals,
  savingsGoals,
  onAddCard,
}: CardEditorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      // Delay to prevent immediate close on panel open click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Get existing card types for the selector
  const existingCardTypes = cards.map((card) => ({
    type: card.type,
    configId: card.config?.budgetGoalId || card.config?.savingsGoalId,
  }));

  const getCardLabel = (card: DashboardCardConfig): string => {
    const def = CARD_REGISTRY[card.type];
    if (card.type === "BUDGET_REMAINING" && card.config?.budgetGoalId) {
      const goal = budgetGoals.find((g) => g.id === card.config?.budgetGoalId);
      return goal ? `${def.name}: ${goal.category}` : def.name;
    }
    if (card.type === "SAVINGS_PROGRESS" && card.config?.savingsGoalId) {
      const goal = savingsGoals.find((g) => g.id === card.config?.savingsGoalId);
      return goal ? `${def.name}: ${goal.name}` : def.name;
    }
    return def.name;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel - slides from left to cover sidebar */}
      <div
        ref={panelRef}
        className={`fixed left-0 top-0 h-full w-80 md:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customize Dashboard
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-65px)] p-4">
          {/* Current cards */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Current Cards ({cards.length})
            </h4>
            {cards.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No cards added yet. Add some from below!
              </p>
            ) : (
              <div className="space-y-2">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {getCardLabel(card)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Drag cards on the dashboard to reorder them
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-6" />

          {/* Add cards section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Add Cards
            </h4>
            <CardSelector
              onSelectCard={onAddCard}
              existingCardTypes={existingCardTypes}
              budgetGoals={budgetGoals}
              savingsGoals={savingsGoals}
            />
          </div>
        </div>
      </div>
    </>
  );
}
