"use client";

import { useEffect } from "react";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { cn } from "@/lib/utils";

interface PlaidLinkButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function PlaidLinkButton({ className, children }: PlaidLinkButtonProps) {
  const { createLinkToken, open, ready, isLoading, error } = usePlaidLink();

  useEffect(() => {
    createLinkToken();
  }, [createLinkToken]);

  return (
    <div>
      <button
        onClick={() => open()}
        disabled={!ready || isLoading}
        className={cn(
          "rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          className
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </span>
        ) : (
          children || "Connect Bank Account"
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
