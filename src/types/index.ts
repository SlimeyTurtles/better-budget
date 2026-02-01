import { Decimal } from "@prisma/client/runtime/library";

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

// Analytics types
export interface SpendingDataPoint {
  date: string;
  amount: number;
  category?: string;
}

export interface NetWorthDataPoint {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface IncomeDataPoint {
  date: string;
  amortizedIncome: number;
  actualIncome: number;
  cumulativeAmortized: number;
  cumulativeActual: number;
}

export interface BudgetProjection {
  date: string;
  projectedBalance: number;
  availableToSpend: number;
  targetLine: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SafeSpendingResult {
  daily: number;
  weekly: number;
  monthly: number;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Form types
export interface IncomeConfigFormData {
  projectedMonthlyIncome: number;
  payFrequency: "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";
  nextPayDate?: string;
  rentAmount: number;
  rentDueDay: number;
  monthlySavingsGoal: number;
}

export interface BudgetGoalFormData {
  category: string;
  monthlyLimit: number;
}

// Helper to convert Prisma Decimal to number
export function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  return Number(decimal);
}

// Dashboard card types
export * from "./dashboard";
