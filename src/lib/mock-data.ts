import {
  Position,
  Protocol,
  PortfolioSummary,
  WalletLeaderboardEntry,
  HistoricalDataPoint,
  Strategy,
} from "@/types";

// Protocols
export const MEZO_PROTOCOL: Protocol = {
  id: "mezo",
  name: "Mezo",
  logo: "/protocols/mezo.svg",
  color: "#FF6B35",
  website: "https://mezo.org",
};

// Mock positions for demo
export const mockPositions: Position[] = [
  {
    id: "pos-1",
    protocol: MEZO_PROTOCOL,
    poolName: "BTC Vault",
    poolType: "vault",
    depositedAmount: 0.5,
    depositedAmountUSD: 21500,
    currentAmount: 0.52,
    currentAmountUSD: 24847,
    pnl: 3347,
    pnlPercentage: 15.57,
    apy: 18.2,
    depositDate: new Date("2025-08-15"),
    tokenSymbol: "BTC",
  },
  {
    id: "pos-2",
    protocol: MEZO_PROTOCOL,
    poolName: "ETH-BTC LP",
    poolType: "lp",
    depositedAmount: 2.5,
    depositedAmountUSD: 8500,
    currentAmount: 2.78,
    currentAmountUSD: 10234,
    pnl: 1734,
    pnlPercentage: 20.4,
    apy: 24.5,
    depositDate: new Date("2025-09-20"),
    tokenSymbol: "LP",
  },
  {
    id: "pos-3",
    protocol: MEZO_PROTOCOL,
    poolName: "veBTC Staking",
    poolType: "staking",
    depositedAmount: 0.25,
    depositedAmountUSD: 10750,
    currentAmount: 0.27,
    currentAmountUSD: 12150,
    pnl: 1400,
    pnlPercentage: 13.02,
    apy: 15.8,
    depositDate: new Date("2025-07-01"),
    tokenSymbol: "veBTC",
  },
  {
    id: "pos-4",
    protocol: MEZO_PROTOCOL,
    poolName: "MUSD Stability Pool",
    poolType: "lending",
    depositedAmount: 5000,
    depositedAmountUSD: 5000,
    currentAmount: 5420,
    currentAmountUSD: 5420,
    pnl: 420,
    pnlPercentage: 8.4,
    apy: 12.3,
    depositDate: new Date("2025-10-10"),
    tokenSymbol: "MUSD",
  },
];

// BTC price for mock calculations
const MOCK_BTC_PRICE = 100000;

// Calculate portfolio summary from positions
export function calculatePortfolioSummary(
  positions: Position[]
): PortfolioSummary {
  const totalValueUSD = positions.reduce((sum, p) => sum + p.currentAmountUSD, 0);
  const totalDepositedUSD = positions.reduce(
    (sum, p) => sum + p.depositedAmountUSD,
    0
  );
  const totalPnlUSD = totalValueUSD - totalDepositedUSD;
  const totalPnlPercentage =
    totalDepositedUSD > 0 ? (totalPnlUSD / totalDepositedUSD) * 100 : 0;

  const sortedByPnl = [...positions].sort(
    (a, b) => b.pnlPercentage - a.pnlPercentage
  );

  return {
    totalValueUSD,
    totalValueBTC: totalValueUSD / MOCK_BTC_PRICE,
    totalDepositedUSD,
    totalDepositedBTC: totalDepositedUSD / MOCK_BTC_PRICE,
    totalPnlUSD,
    totalPnlPercentage,
    positionCount: positions.length,
    bestPerformingPosition: sortedByPnl[0],
    worstPerformingPosition: sortedByPnl[sortedByPnl.length - 1],
  };
}

// Mock portfolio summary
export const mockPortfolioSummary = calculatePortfolioSummary(mockPositions);

// Mock leaderboard data (using realistic testnet addresses)
export const mockLeaderboard: WalletLeaderboardEntry[] = [
  {
    rank: 1,
    address: "0x7a3d8F4c9E2b1A5d6C8e3F9B2a4D7E8c1f924f82",
    totalValueUSD: 847520,
    totalPnlUSD: 156840,
    pnlPercentage: 34.2,
    topStrategy: "BTC Vault + veBTC Combo",
    positionCount: 5,
    lastActive: new Date("2026-01-24"),
  },
  {
    rank: 2,
    address: "0x9c1e2A5B8d3F7C6e4A9b2D8E1c5F3a7B9d4ea45b",
    totalValueUSD: 523100,
    totalPnlUSD: 89450,
    pnlPercentage: 28.7,
    topStrategy: "Pure veBTC Staking",
    positionCount: 3,
    lastActive: new Date("2026-01-24"),
  },
  {
    rank: 3,
    address: "0x2b84fC7A9e3D1B5c8F6a4E2d7C9B3f8A1e5de91c",
    totalValueUSD: 412800,
    totalPnlUSD: 72350,
    pnlPercentage: 24.1,
    topStrategy: "LP Farming Focus",
    positionCount: 7,
    lastActive: new Date("2026-01-23"),
  },
  {
    rank: 4,
    address: "0x5d91aE8c2F4B7d9A3e6C1b5D8f2A4e7C9b3db27e",
    totalValueUSD: 298400,
    totalPnlUSD: 48920,
    pnlPercentage: 21.5,
    topStrategy: "Diversified Vaults",
    positionCount: 4,
    lastActive: new Date("2026-01-23"),
  },
  {
    rank: 5,
    address: "0x1f7c3B9a4E8d2C5F7b3A6e9D1c4F8a2B5e7dd84a",
    totalValueUSD: 185200,
    totalPnlUSD: 28640,
    pnlPercentage: 18.3,
    topStrategy: "MUSD + BTC Vault",
    positionCount: 2,
    lastActive: new Date("2026-01-22"),
  },
];

// Mock historical data (last 6 months)
export const mockHistoricalData: HistoricalDataPoint[] = Array.from(
  { length: 180 },
  (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (180 - i));

    // Simulate gradual growth with some volatility
    const baseDeposited = 35000 + (i > 30 ? 5000 : 0) + (i > 90 ? 5750 : 0);
    const growthRate = 1 + (i / 180) * 0.15 + Math.sin(i / 10) * 0.02;
    const valueUSD = baseDeposited * growthRate;

    return {
      date,
      valueUSD,
      depositedUSD: baseDeposited,
      pnlUSD: valueUSD - baseDeposited,
    };
  }
);

// Mock strategies
export const mockStrategies: Strategy[] = [
  {
    id: "strat-1",
    name: "Conservative BTC Yield",
    description:
      "Low-risk strategy focused on BTC vaults with stable yields",
    protocols: [MEZO_PROTOCOL],
    avgApy: 12.5,
    riskLevel: "low",
    walletCount: 1847,
    totalValueLocked: 45000000,
  },
  {
    id: "strat-2",
    name: "LP Maximizer",
    description:
      "Higher yields through liquidity provision, accepts impermanent loss risk",
    protocols: [MEZO_PROTOCOL],
    avgApy: 24.8,
    riskLevel: "medium",
    walletCount: 923,
    totalValueLocked: 28000000,
  },
  {
    id: "strat-3",
    name: "veBTC Power User",
    description:
      "Lock BTC for voting power and maximum protocol rewards",
    protocols: [MEZO_PROTOCOL],
    avgApy: 18.2,
    riskLevel: "medium",
    walletCount: 456,
    totalValueLocked: 62000000,
  },
];
