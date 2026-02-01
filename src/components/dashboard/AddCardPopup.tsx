"use client";

import { useState, useRef, useEffect } from "react";
import { CardSelector } from "./CardSelector";
import { CardType } from "@/types/dashboard";

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

interface AddCardPopupProps {
  isEditMode: boolean;
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  existingCardTypes: { type: CardType; configId?: string }[];
  onAddCard: (type: CardType, config?: { budgetGoalId?: string; savingsGoalId?: string }) => void;
}

export function AddCardPopup({
  isEditMode,
  budgetGoals,
  savingsGoals,
  existingCardTypes,
  onAddCard,
}: AddCardPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  if (!isEditMode) return null;

  const handleAddCard = (type: CardType, config?: { budgetGoalId?: string; savingsGoalId?: string }) => {
    onAddCard(type, config);
    setIsOpen(false);
  };

  return (
    <div ref={popupRef} className="fixed bottom-6 right-6 z-50">
      {/* Add Card Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-medium transition-all ${
          isOpen
            ? "bg-gray-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-45" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {isOpen ? "Close" : "Add Card"}
      </button>

      {/* Popup Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Add Card</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click to add a card to your dashboard
            </p>
          </div>
          <div className="p-4">
            <CardSelector
              onSelectCard={handleAddCard}
              existingCardTypes={existingCardTypes}
              budgetGoals={budgetGoals}
              savingsGoals={savingsGoals}
            />
          </div>
        </div>
      )}
    </div>
  );
}
