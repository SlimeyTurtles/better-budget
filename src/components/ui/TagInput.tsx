"use client";

import { useState, useRef, useEffect } from "react";
import { TagBadge } from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  isSystem?: boolean;
}

interface TagInputProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string) => Promise<Tag | null>;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInput({
  selectedTags,
  availableTags,
  onChange,
  onCreateTag,
  disabled = false,
  placeholder = "Add tags...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on input and exclude already selected
  // Sort so non-system tags appear first, then system tags
  const filteredTags = availableTags
    .filter(
      (tag) =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.some((st) => st.id === tag.id)
    )
    .sort((a, b) => {
      if (a.isSystem === b.isSystem) return a.name.localeCompare(b.name);
      return a.isSystem ? 1 : -1;
    });

  // Check if input matches an exact existing tag name
  const exactMatch = availableTags.find(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
  );

  // Show create option if there's input and no exact match
  const showCreateOption = inputValue.trim() && !exactMatch && onCreateTag;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !inputValue.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(inputValue.trim());
      if (newTag) {
        onChange([...selectedTags, newTag]);
        setInputValue("");
        setIsOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleSelectTag(filteredTags[0]);
      } else if (showCreateOption) {
        handleCreateTag();
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap gap-1 min-h-[42px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="sm"
            onRemove={disabled ? undefined : () => handleRemoveTag(tag.id)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (filteredTags.length > 0 || showCreateOption) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isCreating}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600 dark:text-blue-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isCreating ? "Creating..." : `Create "${inputValue}"`}
            </button>
          )}
          {(() => {
            const userTags = filteredTags.filter((t) => !t.isSystem);
            const systemTags = filteredTags.filter((t) => t.isSystem);
            return (
              <>
                {userTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || "#6B7280" }}
                    />
                    <span className="text-gray-900 dark:text-white">{tag.name}</span>
                  </button>
                ))}
                {userTags.length > 0 && systemTags.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1">
                    <p className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                      Categories
                    </p>
                  </div>
                )}
                {systemTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || "#6B7280" }}
                    />
                    <span className="text-gray-900 dark:text-white">{tag.name}</span>
                  </button>
                ))}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
