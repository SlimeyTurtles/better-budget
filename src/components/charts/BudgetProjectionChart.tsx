"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface BudgetProjection {
  date: string;
  projectedBalance: number;
  availableToSpend: number;
  targetLine: number;
}

interface BudgetProjectionChartProps {
  data: BudgetProjection[];
  height?: number;
  rentAmount?: number;
  savingsGoal?: number;
}

export function BudgetProjectionChart({
  data,
  height = 300,
  rentAmount = 0,
  savingsGoal = 0,
}: BudgetProjectionChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No projection data available
      </div>
    );
  }

  const targetAmount = rentAmount + savingsGoal;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatDateShort(value)}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000) {
              return `$${(value / 1000).toFixed(0)}k`;
            }
            return `$${value}`;
          }}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              projectedBalance: "Projected Balance",
              availableToSpend: "Available to Spend",
              targetLine: "Target (Rent + Savings)",
            };
            return [formatCurrency(value), labels[name] || name];
          }}
          labelFormatter={(label) => formatDateShort(label)}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        {/* Target line for rent + savings */}
        {targetAmount > 0 && (
          <ReferenceLine
            y={targetAmount}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `Target: ${formatCurrency(targetAmount)}`,
              position: "insideTopRight",
              fill: "#ef4444",
              fontSize: 12,
            }}
          />
        )}
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="projectedBalance"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorProjected)"
          name="Projected Balance"
        />
        <Area
          type="monotone"
          dataKey="availableToSpend"
          stroke="#22c55e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAvailable)"
          name="Available to Spend"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
