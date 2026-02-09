"use client";

import { useState, useCallback } from "react";
import { usePlaidLink as usePlaidLinkLib, PlaidLinkOnSuccess } from "react-plaid-link";

export function usePlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link token");
      }

      setLinkToken(data.link_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token: publicToken,
            metadata: {
              institution: metadata.institution,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to connect account");
        }

        // Refresh the page to show new accounts
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLinkLib(config);

  return {
    createLinkToken,
    open,
    ready: ready && !!linkToken,
    isLoading,
    error,
  };
}
