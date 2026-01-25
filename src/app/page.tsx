"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Activity,
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3,
} from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { PositionCard } from "@/components/ui/position-card";
import { LeaderboardTable } from "@/components/ui/leaderboard-table";
import { APRExplainer } from "@/components/ui/apr-explainer";
import { PortfolioChart } from "@/components/ui/portfolio-chart";
import {
  mockPositions,
  mockPortfolioSummary,
  mockLeaderboard,
  mockHistoricalData,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

// Hero section for non-connected users
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-pulse-red-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pulse-pink-200/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 mb-8">
            <Sparkles className="h-4 w-4 text-pulse-red-500" />
            <span className="text-sm font-medium text-gray-600">
              Built for the Mezo Community
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Track Your{" "}
            <span className="gradient-text">Real Yield</span>,<br />
            Not Just APR Numbers
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto text-balance">
            Finally understand your DeFi profits. See exactly how much you've
            deposited, how much you've earned, and which strategies actually
            perform best.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ConnectButton />
            <button className="btn-secondary flex items-center gap-2">
              View Demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-white/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pulse-red-100 text-pulse-red-600 mb-4 mx-auto">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Real PnL Tracking
              </h3>
              <p className="text-sm text-gray-600">
                See your actual profits in dollars, not confusing percentages
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-white/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pulse-pink-100 text-pulse-pink-600 mb-4 mx-auto">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Strategy Insights
              </h3>
              <p className="text-sm text-gray-600">
                Discover which wallets and strategies earn the best yields
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur border border-white/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 mb-4 mx-auto">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Read-Only & Safe
              </h3>
              <p className="text-sm text-gray-600">
                We only read your data. No transactions, no approvals needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Dashboard for connected users
function Dashboard() {
  const summary = mockPortfolioSummary;
  const positions = mockPositions;
  const leaderboard = mockLeaderboard;
  const historicalData = mockHistoricalData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500">
          Your complete yield portfolio overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Value"
          value={summary.totalValueUSD}
          format="currency"
          icon={<Wallet className="h-5 w-5" />}
          highlight
        />
        <StatCard
          label="Total Deposited"
          value={summary.totalDepositedUSD}
          format="currency"
          icon={<PiggyBank className="h-5 w-5" />}
        />
        <StatCard
          label="Total Profit"
          value={summary.totalPnlUSD}
          format="currency"
          change={summary.totalPnlPercentage}
          icon={<TrendingUp className="h-5 w-5" />}
          highlight
        />
        <StatCard
          label="Positions"
          value={summary.positionCount}
          format="number"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <PortfolioChart data={historicalData} />
        </div>

        {/* APR Explainer */}
        <div className="lg:col-span-1">
          <APRExplainer
            apr={summary.bestPerformingPosition?.apy || 18}
            principal={summary.totalDepositedUSD}
          />
        </div>
      </div>

      {/* Positions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Positions</h2>
            <p className="text-sm text-gray-500">
              {positions.length} active positions across{" "}
              {new Set(positions.map((p) => p.protocol.id)).size} protocols
            </p>
          </div>
          <button className="btn-secondary text-sm py-2 px-4">
            View All Positions
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="mb-8">
        <LeaderboardTable entries={leaderboard.slice(0, 5)} />
      </div>

      {/* Quick Stats Banner */}
      <div className="card-highlight p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Your Best Performing Position
            </h3>
            <p className="text-sm text-gray-600">
              {summary.bestPerformingPosition?.poolName} is earning you{" "}
              <span className="text-profit font-semibold">
                {formatCurrency(
                  (summary.bestPerformingPosition?.pnl || 0) / 30
                )}
                /day
              </span>
            </p>
          </div>
          <button className="btn-primary">
            Explore Similar Strategies
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();

  // Show hero for non-connected users, dashboard for connected
  // For demo purposes, we'll show dashboard by default
  // In production, you'd check isConnected
  
  return (
    <>
      {!isConnected && <HeroSection />}
      {/* Show dashboard with demo data even when not connected for now */}
      <Dashboard />
    </>
  );
}
