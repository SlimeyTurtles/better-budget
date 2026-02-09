"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableCard } from "./DraggableCard";
import { DashboardCard } from "./DashboardCard";
import { DashboardCardConfig, CardData } from "@/types/dashboard";

interface DraggableCardGridProps {
  cards: DashboardCardConfig[];
  cardDataMap: Partial<Record<string, CardData["data"]>>;
  isEditMode: boolean;
  onCardsChange: (cards: DashboardCardConfig[]) => void;
  onRemoveCard: (cardId: string) => void;
  onEmergencyFundUpdate?: (currentAmount: number, targetAmount: number) => void;
}

export function DraggableCardGrid({
  cards,
  cardDataMap,
  isEditMode,
  onCardsChange,
  onRemoveCard,
  onEmergencyFundUpdate,
}: DraggableCardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((card) => card.id === active.id);
      const newIndex = cards.findIndex((card) => card.id === over.id);

      const newCards = arrayMove(cards, oldIndex, newIndex).map((card, index) => ({
        ...card,
        position: index,
      }));

      onCardsChange(newCards);
    }
  };

  const getCardData = (card: DashboardCardConfig): CardData["data"] | null => {
    // For cards that require config, use the specific ID
    if (card.type === "BUDGET_REMAINING" && card.config?.budgetGoalId) {
      return cardDataMap[`budget-${card.config.budgetGoalId}`] || null;
    }
    if (card.type === "SAVINGS_PROGRESS" && card.config?.savingsGoalId) {
      return cardDataMap[`savings-${card.config.savingsGoalId}`] || null;
    }
    // For static cards, use the type as key
    return cardDataMap[card.type] || null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const data = getCardData(card);
            if (!data) return null;

            return (
              <DraggableCard
                key={card.id}
                id={card.id}
                isEditMode={isEditMode}
                onRemove={isEditMode ? () => onRemoveCard(card.id) : undefined}
              >
                <DashboardCard
                  type={card.type}
                  data={data}
                  onUpdate={card.type === "EMERGENCY_FUND" ? onEmergencyFundUpdate : undefined}
                />
              </DraggableCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
