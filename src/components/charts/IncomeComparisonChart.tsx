"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface IncomeDataPoint {
  date: string;
  amortizedIncome: number;
  actualIncome: number;
  cumulativeAmortized: number;
  cumulativeActual: number;
}

interface IncomeComparisonChartProps {
  data: IncomeDataPoint[];
  height?: number;
  showCumulative?: boolean;
}

export function IncomeComparisonChart({
  data,
  height = 300,
  showCumulative = false,
}: IncomeComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No income data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              amortizedIncome: "Projected (Amortized)",
              actualIncome: "Actual Income",
              cumulativeAmortized: "Cumulative Projected",
              cumulativeActual: "Cumulative Actual",
            };
            return [formatCurrency(Number(value) || 0), labels[name as string] || name];
          }}
          labelFormatter={(label) => formatDateShort(label)}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
        {showCumulative ? (
          <>
            <Line
              type="monotone"
              dataKey="cumulativeAmortized"
              name="Projected (Cumulative)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cumulativeActual"
              name="Actual (Cumulative)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="amortizedIncome"
              name="Projected (Daily)"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Bar
              dataKey="actualIncome"
              name="Actual Income"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
