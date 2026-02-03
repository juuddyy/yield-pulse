import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APRExplanation } from "@/types";

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency with proper decimals
export function formatCurrency(
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
    compact?: boolean;
  }
): string {
  const { decimals = 2, showSign = false, compact = false } = options || {};

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? "compact" : "standard",
  });

  const formatted = formatter.format(Math.abs(value));

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return value >= 0 ? formatted : `-${formatted}`;
}

// Format percentage
export function formatPercentage(
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string {
  const { decimals = 2, showSign = false } = options || {};

  const formatted = `${Math.abs(value).toFixed(decimals)}%`;

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return value >= 0 ? formatted : `-${formatted}`;
}

// Shorten wallet address
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Calculate APR explanation in simple terms
export function explainAPR(apr: number, principal: number): APRExplanation {
  const dailyRate = apr / 365;
  const monthlyEstimate = (principal * apr) / 12 / 100;
  const yearlyEstimate = (principal * apr) / 100;

  // Calculate compounded APY (assuming daily compounding)
  const compoundedApy = (Math.pow(1 + apr / 100 / 365, 365) - 1) * 100;

  return {
    apr,
    dailyRate,
    monthlyEstimate,
    yearlyEstimate,
    compoundedApy,
  };
}

// Format date relative to now
export function formatRelativeDate(date: Date | undefined | null): string {
  if (!date) return "Unknown";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Calculate PnL from deposit and current value
export function calculatePnL(
  deposited: number,
  current: number
): { pnl: number; percentage: number } {
  const pnl = current - deposited;
  const percentage = deposited > 0 ? (pnl / deposited) * 100 : 0;
  return { pnl, percentage };
}

// Format large numbers (TVL, etc.)
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// Get color class based on value (positive/negative)
export function getPnLColorClass(value: number): string {
  if (value > 0) return "text-profit";
  if (value < 0) return "text-loss";
  return "text-neutral";
}

// Get background color class based on value
export function getPnLBgClass(value: number): string {
  if (value > 0) return "bg-profit/10";
  if (value < 0) return "bg-loss/10";
  return "bg-neutral/10";
}
