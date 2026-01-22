"use client";

import { useEffect, useState } from "react";
import { PlaidLinkButton } from "@/components/plaid/PlaidLinkButton";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: string | null;
  availableBalance: string | null;
  isHidden: boolean;
  plaidItem: {
    institutionName: string | null;
    status: string;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncTransactions() {
    setIsSyncing(true);
    try {
      await fetch("/api/plaid/sync-transactions", { method: "POST" });
      await fetchAccounts();
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setIsSyncing(false);
    }
  }

  async function deleteAccount(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (response.ok) {
        setAccounts(accounts.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  // Calculate totals
  const totals = accounts.reduce(
    (acc, account) => {
      const balance = Number(account.currentBalance || 0);
      if (account.type === "CREDIT" || account.type === "LOAN") {
        acc.liabilities += Math.abs(balance);
      } else {
        acc.assets += balance;
      }
      return acc;
    },
    { assets: 0, liabilities: 0 }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your connected bank accounts
          </p>
        </div>
        <div className="flex gap-3">
          {accounts.length > 0 && (
            <button
              onClick={syncTransactions}
              disabled={isSyncing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Transactions"}
            </button>
          )}
          <PlaidLinkButton />
        </div>
      </div>

      {/* Summary Cards */}
      {accounts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Assets</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(totals.assets)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(totals.liabilities)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Net Worth</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                totals.assets - totals.liabilities >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(totals.assets - totals.liabilities)}
            </p>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No accounts connected
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Connect your bank accounts to start tracking your finances.
          </p>
          <div className="mt-6">
            <PlaidLinkButton />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <ul className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <li key={account.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        account.type === "CREDIT" || account.type === "LOAN"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {account.type === "CREDIT" ? (
                        <CreditCardIcon />
                      ) : account.type === "LOAN" ? (
                        <BankIcon />
                      ) : (
                        <WalletIcon />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">
                        {account.plaidItem.institutionName || "Unknown Bank"}
                        {account.mask && ` •••• ${account.mask}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          account.type === "CREDIT" || account.type === "LOAN"
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(Number(account.currentBalance || 0))}
                      </p>
                      <p className="text-sm text-gray-500">
                        {account.type.toLowerCase().replace("_", " ")}
                      </p>
                    </div>
                    {/* Delete Button */}
                    {confirmDelete === account.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteAccount(account.id)}
                          disabled={deletingId === account.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === account.id ? "Removing..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(account.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        title="Remove account"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CreditCardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
