"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendlineDataPoint {
  date: string;
  unit: number;
  label: string;
  income: number;
  rent: number;
  savings: number;
  actual: number | null;
}

type TimePeriod = "daily" | "weekly" | "biweekly" | "monthly";

interface MonthlyBudgetChartProps {
  data: TrendlineDataPoint[];
  currentUnit: number;
  period: TimePeriod;
  height?: number;
}

export function MonthlyBudgetChart({
  data,
  currentUnit,
  period,
  height = 400,
}: MonthlyBudgetChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No budget data available
      </div>
    );
  }

  // Get x-axis label based on period
  const getXAxisLabel = () => {
    switch (period) {
      case "daily":
        return "Hour";
      case "weekly":
      case "biweekly":
      case "monthly":
      default:
        return "Day";
    }
  };

  // Get "now" label based on period
  const getNowLabel = () => {
    switch (period) {
      case "daily":
        return "Now";
      case "weekly":
      case "biweekly":
      case "monthly":
      default:
        return "Today";
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          interval={period === "daily" ? 3 : period === "biweekly" ? 1 : "preserveStartEnd"}
          label={{ value: getXAxisLabel(), position: "bottom", offset: -5, fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000) {
              return `$${(value / 1000).toFixed(1)}k`;
            }
            return `$${value}`;
          }}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: string) => {
            if (value === null || value === undefined) return ["-", name];
            const labels: Record<string, string> = {
              income: "Income Goal",
              rent: "Rent + Utilities",
              savings: "Rent + Utilities + Savings",
              actual: "Actual Balance",
            };
            return [formatCurrency(Number(value)), labels[name] || name];
          }}
          labelFormatter={(label) => `${getXAxisLabel()}: ${label}`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              income: "Income Goal",
              rent: "Rent + Utilities",
              savings: "Rent + Utilities + Savings",
              actual: "Actual Balance",
            };
            return labels[value] || value;
          }}
        />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

        {/* Current position marker */}
        <ReferenceLine
          x={data.find((d) => d.unit === currentUnit)?.label}
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          label={{
            value: getNowLabel(),
            position: "top",
            fill: "#f59e0b",
            fontSize: 12,
          }}
        />

        {/* Income trendline (green) - total income goal */}
        <Line
          type="linear"
          dataKey="income"
          name="income"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          connectNulls={true}
        />

        {/* Rent + Utilities trendline (blue) */}
        <Line
          type="linear"
          dataKey="rent"
          name="rent"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          connectNulls={true}
        />

        {/* Rent + Utilities + Savings trendline (purple) */}
        <Line
          type="linear"
          dataKey="savings"
          name="savings"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          connectNulls={true}
        />

        {/* Actual balance line (orange) */}
        <Line
          type="monotone"
          dataKey="actual"
          name="actual"
          stroke="#f97316"
          strokeWidth={3}
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
