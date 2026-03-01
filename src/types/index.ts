// Core Types for Yield Pulse

export interface Position {
  id: string;
  protocol: Protocol;
  poolName: string;
  poolType: PoolType;
  depositedAmount: number;
  depositedAmountUSD: number; // USD value at time of deposit (historical)
  currentAmount: number;
  currentAmountUSD: number; // USD value at current prices
  pnl: number; // Total profit/loss
  pnlPercentage: number;
  apy: number;
  depositDate?: Date; // Optional - may not be available from blockchain
  unlockDate?: Date; // For locked positions
  tokenSymbol: string;
  tokenIcon?: string;
  /** On-chain contract address for explorer links */
  contractAddress?: string;
  // Enhanced reward tracking
  rewards?: {
    pendingAmount: number;
    pendingUSD: number;
    claimedAmount?: number;
    claimedUSD?: number;
    rewardToken: string;
  };
  // Price context
  priceAtDeposit?: number; // BTC/token price when deposited
  currentPrice?: number; // Current BTC/token price
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
  /** Sum of claimed + pending rewards in USD */
  totalRewardsUSD: number;
  /** Already claimed / withdrawn rewards in USD */
  claimedRewardsUSD: number;
  /** Currently pending / claimable rewards in USD */
  pendingRewardsUSD: number;
  topStrategy: string;
  positionCount: number;
  lastActive: Date;
  // optional position flags (populated by useLeaderboard)
  hasVeBtc?: boolean;
  hasVault?: boolean;
  hasSavings?: boolean;
  veBtcLocked?: number;
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
