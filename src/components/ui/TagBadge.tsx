"use client";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  isSystem?: boolean;
}

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function TagBadge({ tag, onRemove, size = "md" }: TagBadgeProps) {
  const sizeClasses = size === "sm"
    ? "text-xs px-1.5 py-0.5"
    : "text-sm px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${tag.color || "#6B7280"}20`,
        color: tag.color || "#6B7280",
        border: `1px solid ${tag.color || "#6B7280"}40`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
        >
          <svg
            className={size === "sm" ? "h-3 w-3" : "h-4 w-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
    </span>
  );
}
