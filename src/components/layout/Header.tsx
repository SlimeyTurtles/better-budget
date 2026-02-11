"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { openMobile } = useSidebar();

  const getPageInfo = () => {
    if (pathname === "/dashboard") {
      return {
        title: `Welcome back${session?.user?.name ? `, ${session.user.name}` : ""}!`,
        subtitle: "Your financial overview at a glance",
      };
    }

    const pages: Record<string, { title: string; subtitle: string }> = {
      "/transactions": { title: "Transactions", subtitle: "View and manage your transaction history" },
      "/accounts": { title: "Accounts", subtitle: "Manage your connected bank accounts" },
      "/budget": { title: "Budget", subtitle: "Track your spending against your budget" },
      "/net-worth": { title: "Net Worth", subtitle: "Track your wealth over time" },
      "/settings": { title: "Settings", subtitle: "Configure your budget settings" },
      "/settings/income": { title: "Income Settings", subtitle: "Set up your income and monthly obligations" },
    };

    return pages[pathname] || { title: "Better Budget", subtitle: "" };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={openMobile}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
            {pageInfo.title}
          </h1>
          {pageInfo.subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              {pageInfo.subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {session?.user && (
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] md:max-w-none">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
