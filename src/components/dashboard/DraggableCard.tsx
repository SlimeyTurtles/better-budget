"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";

interface DraggableCardProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove?: () => void;
}

export function DraggableCard({ id, children, isEditMode, onRemove }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-50" : ""} h-full min-h-[200px] [&>div]:h-full [&>div]:flex [&>div]:flex-col`}
    >
      {isEditMode && (
        <>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex h-6 w-12 cursor-grab items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <svg
              className="h-4 w-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>

          {/* Remove button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md"
              title="Remove card"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </>
      )}
      {children}
    </div>
  );
}
