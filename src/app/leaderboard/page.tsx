"use client";

import { useState } from "react";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";

import { mockLeaderboard } from "@/lib/mock-data";
import {
  formatCurrency,
  formatPercentage,
  shortenAddress,
  formatRelativeDate,
  getPnLColorClass,
} from "@/lib/utils";

const timeFilters = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "all", label: "All Time" },
];

const rankIcons: Record<number, typeof Trophy> = {
  1: Trophy,
  2: Medal,
  3: Award,
};

const rankColors: Record<number, string> = {
  1: "text-yellow-500 bg-yellow-50",
  2: "text-gray-400 bg-gray-50",
  3: "text-amber-600 bg-amber-50",
};

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState("30d");
  const leaderboard = mockLeaderboard;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-500">
            Top performing wallets and their winning strategies
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === filter.id
                  ? "bg-pulse-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-highlight p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Top Yield</span>
          </div>
          <p className="text-2xl font-bold text-profit">
            +{formatPercentage(leaderboard[0]?.pnlPercentage || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {shortenAddress(leaderboard[0]?.address || "", 6)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Tracked
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2,847</p>
          <p className="text-sm text-gray-500 mt-1">Active wallets</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Avg. Return</span>
          </div>
          <p className="text-2xl font-bold text-profit">+18.4%</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((entry, index) => {
          const RankIcon = rankIcons[entry.rank];
          const rankColor = rankColors[entry.rank];

          return (
            <div
              key={entry.address}
              className={`card p-6 ${
                entry.rank === 1 ? "ring-2 ring-yellow-400 bg-yellow-50/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${rankColor}`}
                >
                  <RankIcon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-bold text-gray-200">
                  #{entry.rank}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400" />
                <div>
                  <p className="font-mono font-semibold text-gray-900">
                    {shortenAddress(entry.address, 6)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Active {formatRelativeDate(entry.lastActive)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Value</span>
                  <span className="font-semibold">
                    {formatCurrency(entry.totalValueUSD, { compact: true })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Profit</span>
                  <span className={`font-semibold ${getPnLColorClass(entry.totalPnlUSD)}`}>
                    {formatCurrency(entry.totalPnlUSD, { showSign: true, compact: true })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Return</span>
                  <span className="font-semibold text-profit">
                    +{formatPercentage(entry.pnlPercentage)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700">
                  {entry.topStrategy}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Full Rankings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Total Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Profit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Strategy
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  Positions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map((entry) => (
                <tr key={entry.address} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">#{entry.rank}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400" />
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {shortenAddress(entry.address, 6)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeDate(entry.lastActive)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatCurrency(entry.totalValueUSD, { compact: true })}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${getPnLColorClass(entry.totalPnlUSD)}`}>
                    {formatCurrency(entry.totalPnlUSD, { showSign: true, compact: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-profit font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      +{formatPercentage(entry.pnlPercentage)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pulse-red-50 text-pulse-red-700">
                      {entry.topStrategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {entry.positionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
