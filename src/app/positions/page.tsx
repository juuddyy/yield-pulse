"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

import { PositionCard } from "@/components/ui/position-card";
import { usePositions, UserPosition } from "@/hooks/usePositions";
import { useTotalProfit } from "@/hooks/useTotalProfit";
import { mockPositions, mockPortfolioSummary } from "@/lib/mock-data";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Position } from "@/types";

// Helper to convert UserPosition to Position format
function convertToPositionCard(pos: UserPosition): Position {
  const poolTypeMap: Record<string, "vault" | "lp" | "staking" | "lending"> = {
    lock: "staking",
    vault: "vault",
    lp: "lp",
    savings: "lending",
  };

  return {
    id: pos.id,
    poolName: pos.name,
    protocol: {
      id: "mezo",
      name: pos.protocol,
      logo: "/mezo-logo.png",
      color: "#dc2626",
      website: "https://mezo.org",
    },
    poolType: poolTypeMap[pos.type] || "vault",
    depositedAmount: parseFloat(pos.depositedAmount),
    depositedAmountUSD: pos.depositedValue,
    currentAmount: parseFloat(pos.currentAmount),
    currentAmountUSD: pos.currentValue,
    pnl: pos.pnl,
    pnlPercentage: pos.pnlPercent,
    apy: pos.apy,
    tokenSymbol: pos.token,
    tokenIcon: pos.token === "BTC" ? "/btc-logo.png" : "/musd-logo.png",
    depositDate: pos.unlockDate || undefined,
  };
}

export default function PositionsPage() {
  const { isConnected, address } = useAccount();
  const { positions: realPositions, totalPnL, isLoading } = usePositions();
  const { totalProfitUSD: lifetimeProfitUSD } = useTotalProfit();

  // Use real data when connected (even if empty), mock data only when disconnected
  const useRealData = isConnected;
  const positions = useRealData
    ? realPositions.map(convertToPositionCard)
    : mockPositions;

  const summary = useRealData ? {
    totalPnlUSD: totalPnL,
    bestPerformingPosition: realPositions.reduce((best, current) =>
      current.pnlPercent > (best?.pnlPercent || 0) ? current : best, realPositions[0]
    ),
  } : mockPortfolioSummary;

  const avgApy = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Positions</h1>
          <p className="text-gray-500">
            {isConnected ? (
              useRealData ? (
                <span className="flex items-center gap-2">
                  Live data from your wallet
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                </span>
              ) : (
                "Scanning blockchain for positions..."
              )
            ) : (
              "Connect your wallet to see your real positions"
            )}
          </p>
        </div>

        {!isConnected && (
          <ConnectButton />
        )}
      </div>

      {/* Loading State */}
      {isLoading && isConnected && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-pulse-red-500" />
          <span className="ml-2 text-gray-500">Loading your positions...</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-red-100 text-pulse-red-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Positions</p>
              <p className="text-xl font-bold text-gray-900">{positions.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Performer</p>
              <p className="text-xl font-bold text-profit">
                {summary.bestPerformingPosition
                  ? `+${formatPercentage('pnlPercent' in summary.bestPerformingPosition
                    ? summary.bestPerformingPosition.pnlPercent
                    : summary.bestPerformingPosition.pnlPercentage || 0)}`
                  : "N/A"
                }
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. APY</p>
              <p className="text-xl font-bold text-gray-900">
                {formatPercentage(avgApy)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Profit</p>
              <p className="text-xl font-bold text-profit">
                {formatCurrency(useRealData ? lifetimeProfitUSD : summary.totalPnlUSD, { showSign: true })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search positions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 
                     focus:border-pulse-red-500 focus:ring-2 focus:ring-pulse-red-500/20
                     transition-all outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary py-2 px-4 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="btn-secondary py-2 px-4 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort by APY
          </button>
        </div>
      </div>

      {/* Positions Grid */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}

      {/* Empty State (when no positions) */}
      {!isLoading && positions.length === 0 && (
        <div className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mx-auto mb-4">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No positions found
          </h3>
          <p className="text-gray-500 mb-6">
            {isConnected
              ? "No yield positions detected in your wallet on Mezo testnet"
              : "Connect your wallet to see your yield positions"
            }
          </p>
          {!isConnected && <ConnectButton />}
        </div>
      )}

      {/* Demo Data Notice */}
      {!useRealData && positions.length > 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> Showing sample positions. Connect your wallet to Mezo Testnet to see your real positions.
          </p>
        </div>
      )}
    </div>
  );
}
