export type CardType =
  | "TOTAL_BALANCE"
  | "MONTHLY_SPENDING"
  | "AVAILABLE_TODAY"
  | "TOTAL_EXPENSES"
  | "BUDGET_REMAINING"
  | "BUDGET_TOTAL_REMAINING"
  | "SAVINGS_PROGRESS"
  | "EMERGENCY_FUND";

export interface CardConfig {
  budgetGoalId?: string;
  savingsGoalId?: string;
}

export interface DashboardCardConfig {
  id: string;
  type: CardType;
  position: number;
  config?: CardConfig;
}

export interface CardDefinition {
  type: CardType;
  name: string;
  description: string;
  color: "blue" | "red" | "green" | "purple" | "emerald" | "orange";
  requiresConfig: boolean;
  configType?: "budgetGoal" | "savingsGoal";
}

export const CARD_REGISTRY: Record<CardType, CardDefinition> = {
  TOTAL_BALANCE: {
    type: "TOTAL_BALANCE",
    name: "Total Balance",
    description: "Sum of all account balances",
    color: "blue",
    requiresConfig: false,
  },
  MONTHLY_SPENDING: {
    type: "MONTHLY_SPENDING",
    name: "Monthly Spending",
    description: "Total spending this month",
    color: "red",
    requiresConfig: false,
  },
  AVAILABLE_TODAY: {
    type: "AVAILABLE_TODAY",
    name: "Available Today",
    description: "Safe spending amount for today",
    color: "green",
    requiresConfig: false,
  },
  TOTAL_EXPENSES: {
    type: "TOTAL_EXPENSES",
    name: "Total Expenses",
    description: "All expenses this period",
    color: "red",
    requiresConfig: false,
  },
  BUDGET_REMAINING: {
    type: "BUDGET_REMAINING",
    name: "Budget Remaining",
    description: "Remaining budget for a category",
    color: "purple",
    requiresConfig: true,
    configType: "budgetGoal",
  },
  BUDGET_TOTAL_REMAINING: {
    type: "BUDGET_TOTAL_REMAINING",
    name: "Total Budget Remaining",
    description: "Remaining across all budgets",
    color: "purple",
    requiresConfig: false,
  },
  SAVINGS_PROGRESS: {
    type: "SAVINGS_PROGRESS",
    name: "Savings Progress",
    description: "Progress toward a savings goal",
    color: "emerald",
    requiresConfig: true,
    configType: "savingsGoal",
  },
  EMERGENCY_FUND: {
    type: "EMERGENCY_FUND",
    name: "Emergency Fund",
    description: "Emergency fund progress",
    color: "emerald",
    requiresConfig: false,
  },
};

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: "default-1", type: "TOTAL_BALANCE", position: 0 },
  { id: "default-2", type: "MONTHLY_SPENDING", position: 1 },
  { id: "default-3", type: "AVAILABLE_TODAY", position: 2 },
  { id: "default-4", type: "EMERGENCY_FUND", position: 3 },
];

// Card data types for rendering
export interface TotalBalanceData {
  assets: number;
  liabilities: number;
  netBalance: number;
}

export interface MonthlySpendingData {
  totalSpending: number;
}

export interface AvailableTodayData {
  availableToday: number;
  availablePerDay: number;
  availableToSpendTotal: number;
  todaySpending: number;
}

export interface TotalExpensesData {
  totalExpenses: number;
}

export interface BudgetRemainingData {
  category: string;
  monthlyLimit: number;
  currentSpending: number;
  remaining: number;
  percentUsed: number;
}

export interface BudgetTotalRemainingData {
  totalLimit: number;
  totalSpending: number;
  totalRemaining: number;
  percentUsed: number;
}

export interface SavingsProgressData {
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  daysUntilGoal?: number | null;
}

export interface EmergencyFundData {
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  daysUntilGoal: number | null;
  dailySavingsRate: number;
}

export type CardData =
  | { type: "TOTAL_BALANCE"; data: TotalBalanceData }
  | { type: "MONTHLY_SPENDING"; data: MonthlySpendingData }
  | { type: "AVAILABLE_TODAY"; data: AvailableTodayData }
  | { type: "TOTAL_EXPENSES"; data: TotalExpensesData }
  | { type: "BUDGET_REMAINING"; data: BudgetRemainingData }
  | { type: "BUDGET_TOTAL_REMAINING"; data: BudgetTotalRemainingData }
  | { type: "SAVINGS_PROGRESS"; data: SavingsProgressData }
  | { type: "EMERGENCY_FUND"; data: EmergencyFundData };
