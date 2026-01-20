"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface ProjectionDataPoint {
  date: string;
  actual?: number;
  projected?: number;
  isToday?: boolean;
}

interface NetWorthProjectionChartProps {
  data: ProjectionDataPoint[];
  height?: number;
}

export function NetWorthProjectionChart({
  data,
  height = 400,
}: NetWorthProjectionChartProps) {
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

  // Find today's index for the reference line
  const todayIndex = data.findIndex((d) => d.isToday);
  const todayDate = todayIndex >= 0 ? data[todayIndex].date : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              actual: "Actual Balance",
              projected: "Projected Balance",
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
        <Legend />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

        {/* Today marker */}
        {todayDate && (
          <ReferenceLine
            x={todayDate}
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
        )}

        {/* Actual spending area (past) */}
        <Area
          type="monotone"
          dataKey="actual"
          name="Actual Balance"
          stroke="#22c55e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorActual)"
          connectNulls={false}
        />

        {/* Projected line (future) */}
        <Line
          type="monotone"
          dataKey="projected"
          name="Projected Balance"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
