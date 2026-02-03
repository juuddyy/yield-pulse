// Core Types for Yield Pulse

export interface Position {
  id: string;
  protocol: Protocol;
  poolName: string;
  poolType: PoolType;
  depositedAmount: number;
  depositedAmountUSD: number;
  currentAmount: number;
  currentAmountUSD: number;
  pnl: number;
  pnlPercentage: number;
  apy: number;
  depositDate: Date;
  tokenSymbol: string;
  tokenIcon?: string;
}

export interface Protocol {
  id: string;
  name: string;
  logo: string;
  color: string;
  website: string;
}

export type PoolType = 'vault' | 'lp' | 'staking' | 'lending';

export interface PortfolioSummary {
  totalValueUSD: number;
  totalValueBTC?: number;
  totalDepositedUSD: number;
  totalDepositedBTC?: number;
  totalPnlUSD: number;
  totalPnlPercentage: number;
  positionCount: number;
  bestPerformingPosition?: Position;
  worstPerformingPosition?: Position;
}

export interface WalletLeaderboardEntry {
  rank: number;
  address: string;
  totalValueUSD: number;
  totalPnlUSD: number;
  pnlPercentage: number;
  topStrategy: string;
  positionCount: number;
  lastActive: Date;
}

export interface HistoricalDataPoint {
  date: Date;
  valueUSD: number;
  depositedUSD: number;
  pnlUSD: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  protocols: Protocol[];
  avgApy: number;
  riskLevel: 'low' | 'medium' | 'high';
  walletCount: number;
  totalValueLocked: number;
}

export interface APRExplanation {
  apr: number;
  dailyRate: number;
  monthlyEstimate: number;
  yearlyEstimate: number;
  compoundedApy: number;
}

// Mezo-specific types
export interface MezoVault {
  address: string;
  name: string;
  token: string;
  tvl: number;
  apy: number;
}

export interface MezoLPPool {
  address: string;
  name: string;
  token0: string;
  token1: string;
  tvl: number;
  apy: number;
  fees24h: number;
}

export interface VeBTCPosition {
  lockedAmount: number;
  lockEndDate: Date;
  votingPower: number;
  pendingRewards: number;
}
