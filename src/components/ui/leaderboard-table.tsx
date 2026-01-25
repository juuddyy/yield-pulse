"use client";

import { WalletLeaderboardEntry } from "@/types";
import {
  cn,
  formatCurrency,
  formatPercentage,
  formatRelativeDate,
  shortenAddress,
  getPnLColorClass,
} from "@/lib/utils";
import { Trophy, Medal, Award, TrendingUp, ExternalLink } from "lucide-react";

interface LeaderboardTableProps {
  entries: WalletLeaderboardEntry[];
  className?: string;
}

const rankIcons: Record<number, typeof Trophy> = {
  1: Trophy,
  2: Medal,
  3: Award,
};

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

export function LeaderboardTable({ entries, className }: LeaderboardTableProps) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-pulse-red-600" />
          <h2 className="font-semibold text-gray-900">Top Yielding Wallets</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Wallets with the best yield performance this month
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Wallet
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                PnL
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Top Strategy
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Positions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const RankIcon = rankIcons[entry.rank];
              const rankColor = rankColors[entry.rank];

              return (
                <tr
                  key={entry.address}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {RankIcon ? (
                        <RankIcon className={cn("h-5 w-5", rankColor)} />
                      ) : (
                        <span className="h-5 w-5 flex items-center justify-center text-sm font-semibold text-gray-400">
                          {entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Wallet */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400" />
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {shortenAddress(entry.address, 6)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Active {formatRelativeDate(entry.lastActive)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Total Value */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(entry.totalValueUSD, { compact: true })}
                    </p>
                  </td>

                  {/* PnL */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex flex-col items-end">
                      <p
                        className={cn(
                          "font-semibold",
                          getPnLColorClass(entry.totalPnlUSD)
                        )}
                      >
                        {formatCurrency(entry.totalPnlUSD, {
                          showSign: true,
                          compact: true,
                        })}
                      </p>
                      <p
                        className={cn(
                          "text-xs flex items-center gap-0.5",
                          getPnLColorClass(entry.pnlPercentage)
                        )}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {formatPercentage(entry.pnlPercentage, { showSign: true })}
                      </p>
                    </div>
                  </td>

                  {/* Strategy */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700">
                      {entry.topStrategy}
                    </span>
                  </td>

                  {/* Positions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-600">
                      {entry.positionCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <button className="text-sm text-pulse-red-600 hover:text-pulse-red-700 font-medium transition-colors flex items-center gap-1">
          View Full Leaderboard
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
