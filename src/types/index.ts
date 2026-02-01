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

export type BudgetPeriodType = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";

export interface BudgetGoalFormData {
  category: string;
  periodType: BudgetPeriodType;
  periodAmount: number;
  startDate?: string;
  endDate?: string;
  periodStartDay?: number;
}

export interface BudgetGoal {
  id: string;
  category: string;
  periodType: BudgetPeriodType;
  periodAmount: number;
  startDate: string | null;
  endDate: string | null;
  periodStartDay: number | null;
  isActive: boolean;
  createdAt?: string;
}

export interface EnhancedBudgetGoal extends BudgetGoal {
  currentSpending: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  periodStart: string;
  periodEnd: string;
  daysRemainingInPeriod: number;
  dailyAllowance: number;
  monthlyEquivalent: number;
  isExpired: boolean;
}

export interface BudgetSummary {
  totalMonthlyIncome: number;
  fixedExpenses: number;
  totalBudgetAllocations: number;
  savingsGoal: number;
  remainingDiscretionary: number;
  dailyDiscretionary: number;
  isOverAllocated: boolean;
  totalCurrentSpending: number;
  goalsCount: number;
  overBudgetCount: number;
}

export interface BudgetSummaryResponse {
  goals: EnhancedBudgetGoal[];
  summary: BudgetSummary;
}

// Helper to convert Prisma Decimal to number
export function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  return Number(decimal);
}

// Dashboard card types
export * from "./dashboard";
