"use client";

import {
  Lightbulb,
  TrendingUp,
  Shield,
  Zap,
  Users,
  DollarSign,
  ArrowRight,
  Info,
} from "lucide-react";

import { mockStrategies } from "@/lib/mock-data";
import { formatCurrency, formatPercentage, formatLargeNumber } from "@/lib/utils";

const riskColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const riskLabels = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

export default function StrategiesPage() {
  const strategies = mockStrategies;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Yield Strategies
        </h1>
        <p className="text-gray-500">
          Discover proven strategies used by top performers
        </p>
      </div>

      {/* Info Banner */}
      <div className="card-highlight p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pulse-red-100 text-pulse-red-600 flex-shrink-0">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              How Strategies Work
            </h3>
            <p className="text-sm text-gray-600">
              These strategies are derived from analyzing top-performing wallets on
              Mezo. Each strategy shows the average APY, risk level, and how many
              wallets are using it. Remember: past performance doesn't guarantee
              future results.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="card overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {strategy.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    riskColors[strategy.riskLevel]
                  }`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {riskLabels[strategy.riskLevel]}
                </span>
              </div>
              <p className="text-sm text-gray-500">{strategy.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-profit mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xl font-bold">
                    {formatPercentage(strategy.avgApy)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Avg. APY</p>
              </div>

              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xl font-bold">
                    {strategy.walletCount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Wallets Using</p>
              </div>

              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-900 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xl font-bold">
                    {formatLargeNumber(strategy.totalValueLocked).replace("$", "")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">TVL</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {strategy.protocols.map((protocol) => (
                  <span
                    key={protocol.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-gray-200"
                  >
                    {protocol.name}
                  </span>
                ))}
              </div>
              <button className="text-pulse-red-600 hover:text-pulse-red-700 font-medium text-sm flex items-center gap-1 transition-colors">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popular Combinations */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Popular Combinations
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pulse-red-400 to-pulse-pink-400 ring-2 ring-white" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 ring-2 ring-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  BTC Vault + veBTC Staking
                </p>
                <p className="text-sm text-gray-500">
                  Earn yield on BTC while gaining voting power
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-profit">~22% APY</p>
              <p className="text-xs text-gray-500">Combined</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 ring-2 ring-white" />
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-red-400 ring-2 ring-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  ETH-BTC LP + MUSD Stability
                </p>
                <p className="text-sm text-gray-500">
                  Diversified yield with stablecoin backing
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-profit">~19% APY</p>
              <p className="text-xs text-gray-500">Combined</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 ring-2 ring-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pure LP Farming</p>
                <p className="text-sm text-gray-500">
                  Maximum yield through liquidity provision
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-profit">~25% APY</p>
              <p className="text-xs text-gray-500">Higher risk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <strong>Disclaimer:</strong> These strategies are for informational
            purposes only and do not constitute financial advice. DeFi investments
            carry significant risks including smart contract vulnerabilities,
            impermanent loss, and market volatility. Always do your own research.
          </p>
        </div>
      </div>
    </div>
  );
}
