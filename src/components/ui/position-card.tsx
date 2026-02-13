"use client";

import { Position } from "@/types";
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatRelativeDate,
  getPnLColorClass,
} from "@/lib/utils";
import {
  Vault,
  Droplets,
  Lock,
  Landmark,
  TrendingUp,
  TrendingDown,
  Calendar,
  Gift,
  Info,
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
  const hasRewards = position.rewards && position.rewards.pendingAmount > 0;

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
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            Deposited
            {position.priceAtDeposit && (
              <span className="group relative">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <span className="hidden group-hover:block absolute bottom-full left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  At ${position.priceAtDeposit.toLocaleString()}/BTC
                </span>
              </span>
            )}
          </p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(position.depositedAmountUSD)}
          </p>
          <p className="text-xs text-gray-400">
            {position.depositedAmount} {position.tokenSymbol}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            Current Value
            {position.currentPrice && (
              <span className="group relative">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <span className="hidden group-hover:block absolute bottom-full left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  At ${position.currentPrice.toLocaleString()}/BTC
                </span>
              </span>
            )}
          </p>
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

      {/* Rewards Section */}
      {hasRewards && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-profit/5 to-emerald-50 border border-profit/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-profit" />
              <span className="text-xs font-medium text-gray-700">Pending Rewards</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-profit">
                +{formatCurrency(position.rewards!.pendingUSD)}
              </p>
              <p className="text-xs text-gray-500">
                {position.rewards!.pendingAmount.toFixed(6)} {position.rewards!.rewardToken}
              </p>
            </div>
          </div>
        </div>
      )}

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
          {position.unlockDate ? (
            position.unlockDate > new Date() 
              ? `Unlocks ${formatRelativeDate(position.unlockDate)}`
              : `Unlocked`
          ) : position.depositDate ? (
            `Deposited ${formatRelativeDate(position.depositDate)}`
          ) : (
            "Position Active"
          )}
        </span>
        <a 
          href={`https://explorer.mezo.org/address/${position.protocol.id === 'mezo' ? '0x05f9de24ad155e8a5e002de8673553c27bda8af6' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pulse-red-600 hover:text-pulse-red-700 font-medium transition-colors"
        >
          View on Explorer →
        </a>
      </div>
    </div>
  );
}
