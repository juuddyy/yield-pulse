"use client";

import { ReactNode } from "react";
import { cn, formatCurrency, formatPercentage, getPnLColorClass } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string; // Secondary value (e.g., BTC equivalent)
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  format?: "currency" | "percentage" | "number" | "none";
  className?: string;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  subValue,
  change,
  changeLabel,
  icon,
  format = "none",
  className,
  highlight = false,
}: StatCardProps) {
  const formattedValue = (() => {
    if (typeof value === "string") return value;
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return formatPercentage(value);
      case "number":
        return value.toLocaleString();
      default:
        return value;
    }
  })();

  const TrendIcon = change
    ? change > 0
      ? TrendingUp
      : change < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <div
      className={cn(
        highlight ? "card-highlight" : "card",
        "p-6 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-red-50 text-pulse-red-600">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="stat-value">{formattedValue}</span>
          {subValue && (
            <span className="text-sm text-gray-500 font-medium">{subValue}</span>
          )}
        </div>

        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              getPnLColorClass(change)
            )}
          >
            {TrendIcon && <TrendIcon className="h-4 w-4" />}
            <span>
              {formatPercentage(change, { showSign: true })}
              {changeLabel && (
                <span className="text-gray-400 font-normal ml-1">
                  {changeLabel}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
