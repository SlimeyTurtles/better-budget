import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone shifts
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(year, month - 1, day));
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone shifts
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(year, month - 1, day));
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export type BudgetPeriodType = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";

export interface PeriodBounds {
  start: Date;
  end: Date;
}

/**
 * Get the bounds of a weekly period containing the given date.
 * @param today - The reference date
 * @param startDay - Day of week the period starts (0=Sunday, 1=Monday, etc.)
 */
export function getWeekBounds(today: Date, startDay: number = 0): PeriodBounds {
  const d = startOfDay(today);
  const currentDay = d.getDay();
  const daysToStart = (currentDay - startDay + 7) % 7;

  const start = new Date(d);
  start.setDate(d.getDate() - daysToStart);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get the bounds of a biweekly period containing the given date.
 * @param today - The reference date
 * @param anchorDate - The anchor date for calculating biweekly periods (optional)
 */
export function getBiweeklyBounds(today: Date, anchorDate?: Date): PeriodBounds {
  const d = startOfDay(today);
  // Default anchor: January 1st of current year
  const anchor = anchorDate ? startOfDay(anchorDate) : new Date(d.getFullYear(), 0, 1);

  const daysSinceAnchor = daysBetween(anchor, d);
  const periodNumber = Math.floor(daysSinceAnchor / 14);

  const start = new Date(anchor);
  start.setDate(anchor.getDate() + periodNumber * 14);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get the bounds of a monthly period containing the given date.
 * @param today - The reference date
 * @param startDay - Day of month the period starts (1-28)
 */
export function getMonthBounds(today: Date, startDay: number = 1): PeriodBounds {
  const d = startOfDay(today);
  const dayOfMonth = d.getDate();

  let start: Date;
  if (dayOfMonth >= startDay) {
    // We're in the current period (startDay this month to startDay-1 next month)
    start = new Date(d.getFullYear(), d.getMonth(), startDay);
  } else {
    // We're in the previous period (startDay last month to startDay-1 this month)
    start = new Date(d.getFullYear(), d.getMonth() - 1, startDay);
  }

  // End is one day before the next start
  const end = new Date(start.getFullYear(), start.getMonth() + 1, startDay - 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get the period bounds for a budget goal.
 */
export function getBudgetPeriodBounds(
  periodType: BudgetPeriodType,
  today: Date,
  options?: {
    startDay?: number;
    startDate?: Date;
    endDate?: Date;
  }
): PeriodBounds {
  switch (periodType) {
    case "WEEKLY":
      return getWeekBounds(today, options?.startDay ?? 0);
    case "BIWEEKLY":
      return getBiweeklyBounds(today, options?.startDate);
    case "MONTHLY":
      return getMonthBounds(today, options?.startDay ?? 1);
    case "CUSTOM":
      if (!options?.startDate || !options?.endDate) {
        throw new Error("CUSTOM period requires startDate and endDate");
      }
      return {
        start: startOfDay(options.startDate),
        end: new Date(options.endDate.getTime()),
      };
    default:
      return getMonthBounds(today, 1);
  }
}

/**
 * Pro-rate a budget amount to monthly equivalent.
 */
export function proRateToMonthly(amount: number, periodType: BudgetPeriodType): number {
  switch (periodType) {
    case "WEEKLY":
      return amount * 4.33; // ~52 weeks / 12 months
    case "BIWEEKLY":
      return amount * 2.17; // ~26 bi-weeks / 12 months
    case "MONTHLY":
      return amount;
    case "CUSTOM":
      return 0; // Custom periods are excluded from monthly calculation
    default:
      return amount;
  }
}

/**
 * Calculate remaining days in a period (including today).
 */
export function getRemainingDaysInPeriod(today: Date, periodEnd: Date): number {
  const daysLeft = daysBetween(startOfDay(today), startOfDay(periodEnd)) + 1;
  return Math.max(1, daysLeft);
}
