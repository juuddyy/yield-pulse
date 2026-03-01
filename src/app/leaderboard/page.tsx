"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Trophy,
  Medal,
  Award,
  Users,
  TrendingUp,
  Gift,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  Lock,
  Landmark,
  Droplets,
} from "lucide-react";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import {
  formatCurrency,
  formatPercentage,
  shortenAddress,
  getPnLColorClass,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

const timeFilters = [
  { id: "recent", label: "Recent Blocks" },
  { id: "all", label: "All Time" },
];

const rankMeta: Record<
  number,
  { Icon: typeof Trophy; color: string; bg: string }
> = {
  1: { Icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50 ring-1 ring-yellow-200" },
  2: { Icon: Medal, color: "text-slate-400", bg: "bg-slate-50 ring-1 ring-slate-200" },
  3: { Icon: Award, color: "text-amber-600", bg: "bg-amber-50 ring-1 ring-amber-200" },
};

export default function LeaderboardPage() {
  const { address: userAddress } = useAccount();
  const [timeFilter, setTimeFilter] = useState("recent");

  // Always reads from Mezo Mainnet
  const { entries, isLoading, error, lastUpdated, refetch } = useLeaderboard(75);

  // Stats from live data
  const topEntry = entries[0];
  const totalTVL = entries.reduce((s, e) => s + e.totalValueUSD, 0);
  const totalRew = entries.reduce((s, e) => s + e.totalRewardsUSD, 0);

  const userRank = userAddress
    ? entries.find(
      (e) => e.address.toLowerCase() === userAddress.toLowerCase()
    )?.rank
    : undefined;

  const explorerBase = "https://explorer.mezo.org/address";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Leaderboard</h1>
          <p className="text-gray-500">
            Top wallets ranked by total rewards earned on Mezo&nbsp;·&nbsp;Live on-chain data
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time filter (cosmetic – affects block range in hook later) */}
          <div className="flex gap-2">
            {timeFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === f.id
                    ? "bg-pulse-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-600"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Top Yield */}
        <div className="card-highlight p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Top Yield</span>
          </div>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-profit">
                {topEntry ? `+${formatPercentage(topEntry.pnlPercentage)}` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                {topEntry ? shortenAddress(topEntry.address, 6) : "No data yet"}
              </p>
            </>
          )}
        </div>

        {/* Wallets Tracked */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Wallets Tracked</span>
          </div>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">unique depositors</p>
            </>
          )}
        </div>

        {/* Total Rewards Earned */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Gift className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Rewards</span>
          </div>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-profit">
                {formatCurrency(totalRew, { compact: true })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">across all tracked wallets</p>
            </>
          )}
        </div>

        {/* Your Rank */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-red-100 text-pulse-red-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Your Rank</span>
          </div>
          {userAddress ? (
            isLoading ? (
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-pulse-red-600">
                  {userRank ? `#${userRank}` : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {userRank ? "out of " + entries.length : "No positions found"}
                </p>
              </>
            )
          ) : (
            <div className="mt-1">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="text-sm font-medium text-pulse-red-600 hover:underline"
                  >
                    Connect wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          )}
        </div>
      </div>

      {/* ── Loading / Error / Empty ── */}
      {isLoading && (
        <div className="card p-14 flex flex-col items-center gap-4 text-gray-400 mb-8">
          <Loader2 className="h-10 w-10 animate-spin text-pulse-red-400" />
          <div className="text-center">
            <p className="font-medium text-gray-600">Scanning Mezo Mainnet…</p>
            <p className="text-sm mt-1">
              Reading deposit events from veBTC, MUSD Vault &amp; sMUSD contracts
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="card p-6 flex items-start gap-3 bg-red-50 border border-red-200 mb-8">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Could not load leaderboard</p>
            <p className="text-sm text-red-600 mt-0.5">{error.message}</p>
            <button onClick={refetch} className="text-sm text-red-700 underline mt-2">
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="card p-14 text-center mb-8">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No wallets found in recent blocks</p>
          <p className="text-sm text-gray-400 mt-1">
            The leaderboard scans the last 50,000 blocks. Try again once more wallets have deposited on Mezo Mainnet.
          </p>
        </div>
      )}

      {/* ── Podium Top 3 ── */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {entries.slice(0, 3).map((entry) => {
            const meta = rankMeta[entry.rank];
            return (
              <div
                key={entry.address}
                className={cn(
                  "card p-6",
                  entry.rank === 1 && "ring-2 ring-yellow-400 bg-yellow-50/20"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", meta.bg)}>
                    <meta.Icon className={cn("h-6 w-6", meta.color)} />
                  </div>
                  <span className="text-4xl font-bold text-gray-100">#{entry.rank}</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400 shrink-0" />
                  <div className="min-w-0">
                    <a
                      href={`${explorerBase}/${entry.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-semibold text-gray-900 hover:text-pulse-red-600 transition-colors flex items-center gap-1 text-sm"
                    >
                      {shortenAddress(entry.address, 8)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex gap-1 mt-1">
                      {entry.hasVeBtc && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700"><Lock className="h-2.5 w-2.5" />veBTC</span>}
                      {entry.hasVault && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700"><Landmark className="h-2.5 w-2.5" />Vault</span>}
                      {entry.hasSavings && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700"><Droplets className="h-2.5 w-2.5" />sMUSD</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Portfolio</span>
                    <span className="font-semibold">{formatCurrency(entry.totalValueUSD, { compact: true })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center gap-1"><Gift className="h-3.5 w-3.5 text-profit" />Total Rewards</span>
                    <span className={cn("font-bold", getPnLColorClass(entry.totalRewardsUSD))}>
                      {formatCurrency(entry.totalRewardsUSD, { showSign: true, compact: true })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Claimed</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(entry.claimedRewardsUSD, { compact: true })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" />Pending</p>
                      <p className="text-sm font-medium text-amber-600">{formatCurrency(entry.pendingRewardsUSD, { compact: true })}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700">
                    {entry.topStrategy}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Rankings Table ── */}
      {!isLoading && entries.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Full Rankings</h2>
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Wallet</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Portfolio</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    <span className="flex items-center justify-end gap-1"><Gift className="h-3.5 w-3.5" />Total Rewards</span>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    <span className="flex items-center justify-end gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Claimed</span>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    <span className="flex items-center justify-end gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" />Pending</span>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Strategy</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pos.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => {
                  const meta = rankMeta[entry.rank];
                  const isMe = userAddress && entry.address.toLowerCase() === userAddress.toLowerCase();
                  return (
                    <tr
                      key={entry.address}
                      className={cn(
                        "hover:bg-gray-50/60 transition-colors",
                        isMe && "bg-pulse-red-50/50 border-l-2 border-pulse-red-500"
                      )}
                    >
                      <td className="px-5 py-3">
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
                      <td className="px-5 py-3">
                        <a
                          href={`${explorerBase}/${entry.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 group"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400 shrink-0" />
                          <div>
                            <p className="font-mono text-sm font-medium group-hover:text-pulse-red-600 transition-colors flex items-center gap-1">
                              {shortenAddress(entry.address, 6)}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <div className="flex gap-1 mt-0.5">
                              {entry.hasVeBtc && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">veBTC</span>}
                              {entry.hasVault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">Vault</span>}
                              {entry.hasSavings && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">sMUSD</span>}
                            </div>
                          </div>
                        </a>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(entry.totalValueUSD, { compact: true })}</p>
                        {entry.hasVeBtc && (entry.veBtcLocked ?? 0) > 0 && (
                          <p className="text-xs text-gray-400">{entry.veBtcLocked!.toFixed(4)} BTC</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className={cn("font-bold", getPnLColorClass(entry.totalRewardsUSD))}>
                          {formatCurrency(entry.totalRewardsUSD, { showSign: true, compact: true })}
                        </p>
                        <p className={cn("text-xs flex items-center justify-end gap-0.5", getPnLColorClass(entry.pnlPercentage))}>
                          <TrendingUp className="h-3 w-3" />
                          {formatPercentage(entry.pnlPercentage, { showSign: true })}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(entry.claimedRewardsUSD, { compact: true })}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-sm font-medium text-amber-600">
                          {formatCurrency(entry.pendingRewardsUSD, { compact: true })}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700">
                          {entry.topStrategy}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-gray-500">
                        {entry.positionCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {entries.length} wallets · Mezo Mainnet (Chain ID 31612)
            </p>
            <p className="text-xs text-gray-400">
              Rewards = claimed from VeBTCRewardsDistributor events + pending claimable
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
