"use client";

import { HistoricalDataPoint } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface PortfolioChartProps {
  data: HistoricalDataPoint[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-2">
          {new Date(data.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-500">Value:</span>{" "}
            <span className="font-semibold">{formatCurrency(data.valueUSD)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Deposited:</span>{" "}
            <span className="font-medium text-gray-600">
              {formatCurrency(data.depositedUSD)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Profit:</span>{" "}
            <span className="font-semibold text-profit">
              {formatCurrency(data.pnlUSD, { showSign: true })}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function PortfolioChart({ data, className }: PortfolioChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: d.date.toISOString(),
    dateLabel: d.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className={cn("card p-6", className)}>
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900">Portfolio Value Over Time</h3>
        <p className="text-sm text-gray-500">
          Track your portfolio growth and yield earnings
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDeposited" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
              interval="preserveStartEnd"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="depositedUSD"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorDeposited)"
              name="Deposited"
            />

            <Area
              type="monotone"
              dataKey="valueUSD"
              stroke="#dc2626"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Current Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pulse-red-600" />
          <span className="text-sm text-gray-600">Current Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-400 border-dashed" style={{ borderTopWidth: 2, borderTopStyle: 'dashed' }} />
          <span className="text-sm text-gray-600">Total Deposited</span>
        </div>
      </div>
    </div>
  );
}
