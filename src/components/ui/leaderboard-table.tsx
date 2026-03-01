"use client";

import {
  cn,
  formatCurrency,
  formatPercentage,
  formatRelativeDate,
  shortenAddress,
  getPnLColorClass,
} from "@/lib/utils";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  ExternalLink,
  Gift,
  CheckCircle,
  Clock,
  Lock,
  Landmark,
  Droplets,
  User,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalValueUSD: number;
  totalRewardsUSD: number;
  claimedRewardsUSD: number;
  pendingRewardsUSD: number;
  pnlPercentage: number;
  topStrategy: string;
  positionCount: number;
  hasVeBtc?: boolean;
  hasVault?: boolean;
  hasSavings?: boolean;
  veBtcLocked?: number;
  lastActive: Date;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserAddress?: string;
  currentUserRank?: number;
  isLoading?: boolean;
  error?: Error | null;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  className?: string;
  compact?: boolean; // dashboard-compact mode – fewer columns
}

const rankMeta: Record<number, { Icon: typeof Trophy; color: string; bg: string }> = {
  1: { Icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
  2: { Icon: Medal, color: "text-slate-400", bg: "bg-slate-50" },
  3: { Icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
};

// Small pill showing which protocols the wallet uses
function ProtocolBadges({ hasVeBtc, hasVault, hasSavings }: { hasVeBtc?: boolean; hasVault?: boolean; hasSavings?: boolean }) {
  return (
    <div className="flex gap-1 mt-1">
      {hasVeBtc && <span title="veBTC Lock" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700"><Lock className="h-2.5 w-2.5" />veBTC</span>}
      {hasVault && <span title="MUSD Vault" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700"><Landmark className="h-2.5 w-2.5" />Vault</span>}
      {hasSavings && <span title="sMUSD Savings" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700"><Droplets className="h-2.5 w-2.5" />sMUSD</span>}
    </div>
  );
}

export function LeaderboardTable({
  entries,
  currentUserAddress,
  currentUserRank,
  isLoading,
  error,
  lastUpdated,
  onRefresh,
  className,
  compact = false,
}: LeaderboardTableProps) {
  const explorerBase = "https://explorer.mezo.org/address";

  return (
    <div className={cn("card overflow-hidden", className)}>
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-pulse-red-600" />
              <h2 className="font-semibold text-gray-900">Top Yielding Wallets</h2>
              {!isLoading && entries.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                  ● LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Ranked by total rewards earned &nbsp;·&nbsp; claimed + pending
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUserRank && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Your Rank</p>
                <p className="text-2xl font-bold text-pulse-red-600">#{currentUserRank}</p>
              </div>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh leaderboard"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="px-6 py-10 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-7 w-7 animate-spin text-pulse-red-400" />
          <p className="text-sm">Scanning Mezo chain for top wallets…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="px-6 py-6 flex items-start gap-3 bg-red-50 border-b border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load leaderboard</p>
            <p className="text-xs text-red-600 mt-0.5">{error.message}</p>
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="px-6 py-10 text-center">
          <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No wallets found in recent blocks.</p>
          <p className="text-xs text-gray-400 mt-1">Data is pulled live — check back after activity picks up on Mezo.</p>
        </div>
      )}

      {/* ── Table ── */}
      {!isLoading && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet</th>
                {!compact && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolio Value</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center justify-end gap-1">
                    <Gift className="h-3.5 w-3.5" /> Total Rewards
                  </span>
                </th>
                {!compact && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Claimed</span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-end gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" />Pending</span>
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => {
                const meta = rankMeta[entry.rank];
                const isCurrentUser =
                  currentUserAddress &&
                  entry.address.toLowerCase() === currentUserAddress.toLowerCase();

                return (
                  <tr
                    key={entry.address}
                    className={cn(
                      "hover:bg-gray-50/70 transition-colors",
                      isCurrentUser && "bg-pulse-red-50/50 border-l-2 border-pulse-red-500"
                    )}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {meta ? (
                        <div className={cn("inline-flex items-center justify-center h-8 w-8 rounded-lg", meta.bg)}>
                          <meta.Icon className={cn("h-4 w-4", meta.color)} />
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 text-sm font-bold text-gray-400">
                          {entry.rank}
                        </span>
                      )}
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-3">
                      <a
                        href={`${explorerBase}/${entry.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 group"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium text-gray-900 group-hover:text-pulse-red-600 transition-colors flex items-center gap-1">
                            {shortenAddress(entry.address, 6)}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          {!compact && (
                            <ProtocolBadges
                              hasVeBtc={entry.hasVeBtc}
                              hasVault={entry.hasVault}
                              hasSavings={entry.hasSavings}
                            />
                          )}
                        </div>
                      </a>
                    </td>

                    {/* Portfolio Value */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(entry.totalValueUSD, { compact: true })}
                        </p>
                        {entry.hasVeBtc && (entry.veBtcLocked ?? 0) > 0 && (
                          <p className="text-xs text-gray-400">
                            {entry.veBtcLocked!.toFixed(4)} BTC locked
                          </p>
                        )}
                      </td>
                    )}

                    {/* Total Rewards */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <p className={cn("font-bold text-sm", getPnLColorClass(entry.totalRewardsUSD))}>
                        {formatCurrency(entry.totalRewardsUSD, { showSign: true, compact: true })}
                      </p>
                      <p className={cn("text-xs flex items-center justify-end gap-0.5", getPnLColorClass(entry.pnlPercentage))}>
                        <TrendingUp className="h-3 w-3" />
                        {formatPercentage(entry.pnlPercentage, { showSign: true })}
                      </p>
                    </td>

                    {/* Claimed */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(entry.claimedRewardsUSD, { compact: true })}
                        </p>
                        <p className="text-xs text-gray-400">withdrawn</p>
                      </td>
                    )}

                    {/* Pending */}
                    {!compact && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <p className="text-sm font-medium text-amber-600">
                          {formatCurrency(entry.pendingRewardsUSD, { compact: true })}
                        </p>
                        <p className="text-xs text-gray-400">claimable</p>
                      </td>
                    )}

                    {/* Strategy */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700 whitespace-nowrap">
                        {entry.topStrategy}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      {!isLoading && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : "Scanning blockchain…"}
          </p>
          <p className="text-xs text-gray-400">
            {entries.length} wallets found · Mezo Mainnet
          </p>
        </div>
      )}
    </div>
  );
}
