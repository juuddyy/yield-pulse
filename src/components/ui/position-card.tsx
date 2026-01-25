"use client";

import { Position } from "@/types";
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatRelativeDate,
  getPnLColorClass,
  getPnLBgClass,
} from "@/lib/utils";
import {
  Vault,
  Droplets,
  Lock,
  Landmark,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";

const poolTypeIcons = {
  vault: Vault,
  lp: Droplets,
  staking: Lock,
  lending: Landmark,
};

const poolTypeLabels = {
  vault: "Vault",
  lp: "Liquidity Pool",
  staking: "Staking",
  lending: "Lending",
};

interface PositionCardProps {
  position: Position;
  className?: string;
}

export function PositionCard({ position, className }: PositionCardProps) {
  const Icon = poolTypeIcons[position.poolType];
  const isProfit = position.pnl >= 0;

  return (
    <div className={cn("card p-5 hover:shadow-md transition-all", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-pulse-red-100 to-pulse-pink-100",
              "text-pulse-red-600"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{position.poolName}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: position.protocol.color }}
              />
              {position.protocol.name} • {poolTypeLabels[position.poolType]}
            </p>
          </div>
        </div>

        {/* APY Badge */}
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-profit/10 text-profit">
            {formatPercentage(position.apy)} APY
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Deposited</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(position.depositedAmountUSD)}
          </p>
          <p className="text-xs text-gray-400">
            {position.depositedAmount} {position.tokenSymbol}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Current Value</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(position.currentAmountUSD)}
          </p>
          <p className="text-xs text-gray-400">
            {position.currentAmount.toFixed(4)} {position.tokenSymbol}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Profit/Loss</p>
          <p className={cn("font-semibold", getPnLColorClass(position.pnl))}>
            {formatCurrency(position.pnl, { showSign: true })}
          </p>
          <p
            className={cn(
              "text-xs flex items-center gap-0.5",
              getPnLColorClass(position.pnl)
            )}
          >
            {isProfit ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(position.pnlPercentage, { showSign: true })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isProfit
                ? "bg-gradient-to-r from-profit to-emerald-400"
                : "bg-gradient-to-r from-loss to-red-400"
            )}
            style={{
              width: `${Math.min(Math.abs(position.pnlPercentage), 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Deposited {formatRelativeDate(position.depositDate)}
        </span>
        <button className="text-pulse-red-600 hover:text-pulse-red-700 font-medium transition-colors">
          View Details →
        </button>
      </div>
    </div>
  );
}
