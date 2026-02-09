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

interface DataPoint {
  label: string;
  unit: number;
  actual: number | null;
  projected: number | null;
}

interface BudgetProjectionLineChartProps {
  trendlineData: {
    label: string;
    unit: number;
    actual: number | null;
  }[];
  currentUnit: number;
  totalUnits?: number;
  rentUtilities: number;
  savingsTarget: number;
  incomePerUnit: number;
  height?: number;
}

export function BudgetProjectionLineChart({
  trendlineData,
  currentUnit,
  rentUtilities,
  savingsTarget,
  incomePerUnit,
  height = 300,
}: BudgetProjectionLineChartProps) {
  if (trendlineData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        No data available
      </div>
    );
  }

  // Get the actual balance at the current unit
  const currentActual = trendlineData.find((d) => d.unit === currentUnit)?.actual ?? 0;

  // Build chart data with actual (past) and projected (future)
  const chartData: DataPoint[] = trendlineData.map((point) => {
    const isPastOrCurrent = point.unit <= currentUnit;
    const isFuture = point.unit > currentUnit;

    // For future points, calculate projected balance (no spending scenario)
    let projected: number | null = null;
    if (isFuture) {
      const unitsFromCurrent = point.unit - currentUnit;
      projected = currentActual + (incomePerUnit * unitsFromCurrent);
    } else if (point.unit === currentUnit) {
      // At current unit, projected starts from actual
      projected = point.actual;
    }

    return {
      label: point.label,
      unit: point.unit,
      actual: isPastOrCurrent ? point.actual : null,
      projected: projected,
    };
  });

  // Find min/max for Y axis
  const allValues = [
    ...chartData.map((d) => d.actual).filter((v): v is number => v !== null),
    ...chartData.map((d) => d.projected).filter((v): v is number => v !== null),
    rentUtilities,
    savingsTarget,
    0,
  ];
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yPadding = (maxY - minY) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[Math.floor(minY - yPadding), Math.ceil(maxY + yPadding)]}
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
          formatter={(value, name) => {
            if (value === null || value === undefined) return ["-", name];
            const labels: Record<string, string> = {
              actual: "Actual Balance",
              projected: "Projected (No Spending)",
            };
            return [formatCurrency(Number(value)), labels[name as string] || name];
          }}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              actual: "Actual Balance",
              projected: "Projected (No Spending)",
            };
            return labels[value] || value;
          }}
        />

        {/* Rent + Utilities horizontal line (red) */}
        <ReferenceLine
          y={rentUtilities}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="8 4"
          label={{
            value: `Rent & Utilities: ${formatCurrency(rentUtilities)}`,
            position: "right",
            fill: "#ef4444",
            fontSize: 11,
          }}
        />

        {/* Savings target horizontal line (blue) */}
        <ReferenceLine
          y={savingsTarget}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="8 4"
          label={{
            value: `Savings Target: ${formatCurrency(savingsTarget)}`,
            position: "right",
            fill: "#3b82f6",
            fontSize: 11,
          }}
        />

        {/* Today marker */}
        <ReferenceLine
          x={trendlineData.find((d) => d.unit === currentUnit)?.label}
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          label={{
            value: "Today",
            position: "top",
            fill: "#f59e0b",
            fontSize: 12,
          }}
        />

        {/* Actual balance line (green, solid) */}
        <Line
          type="monotone"
          dataKey="actual"
          name="actual"
          stroke="#22c55e"
          strokeWidth={3}
          dot={false}
          connectNulls={false}
        />

        {/* Projected balance line (green, dashed) - shows if no spending */}
        <Line
          type="linear"
          dataKey="projected"
          name="projected"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="8 4"
          dot={false}
          connectNulls={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
