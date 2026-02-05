"use client";

import { useAccount, useReadContracts, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { MEZO_TESTNET_CONTRACTS, CHAIN_IDS } from "@/config/contracts";
import { ERC20_ABI, VOTING_ESCROW_ABI, VAULT_ABI } from "@/config/abis";

// BTC price (in production, fetch from oracle or API)
const BTC_PRICE_USD = 100000; // Placeholder - should be fetched dynamically
const MUSD_PRICE_USD = 1; // MUSD is a stablecoin

export interface UserPosition {
  id: string;
  name: string;
  protocol: string;
  type: "lock" | "vault" | "lp" | "savings";
  depositedAmount: string;
  depositedValue: number;
  currentAmount: string;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  apy: number;
  token: string;
  contractAddress: string;
  unlockDate?: Date;
}

export interface PortfolioData {
  totalValue: number;
  totalValueBTC: number; // Total value in BTC terms
  totalDeposited: number;
  totalDepositedBTC: number; // Total deposited in BTC terms
  totalPnL: number;
  pnlPercent: number;
  positions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
}

export function usePositions(): PortfolioData {
  const { address, isConnected, chainId } = useAccount();

  // Get native BTC balance
  const { data: btcBalance } = useBalance({
    address: address,
  });

  // Read from multiple contracts
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      // veBTC - try balanceOf (returns NFT count or voting power)
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // veBTC - get first token ID (for NFT-based locks)
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: address ? [address, BigInt(0)] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // veMEZO - try balanceOf (returns NFT count or voting power)
      {
        address: MEZO_TESTNET_CONTRACTS.VeMEZO,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // veMEZO - get first token ID (for NFT-based locks)
      {
        address: MEZO_TESTNET_CONTRACTS.VeMEZO,
        abi: VOTING_ESCROW_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: address ? [address, BigInt(0)] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // MUSD Vault shares
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // MUSD Vault - convert shares to assets
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "totalAssets",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "totalSupply",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // MUSD Savings Rate shares
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // MUSD Savings Rate - total assets
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "totalAssets",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "totalSupply",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // MUSD token balance
      {
        address: MEZO_TESTNET_CONTRACTS.MUSD,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
    ],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Extract token IDs from initial data for second read
  const veBtcTokenId = data?.[1]?.result as bigint | undefined;
  const veMezoTokenId = data?.[3]?.result as bigint | undefined;

  // Second batch: Get locked amounts using token IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lockContracts: any[] = [];
  if (veBtcTokenId !== undefined) {
    lockContracts.push({
      address: MEZO_TESTNET_CONTRACTS.VeBTC,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veBtcTokenId],
      chainId: CHAIN_IDS.MEZO_TESTNET,
    });
  }
  if (veMezoTokenId !== undefined) {
    lockContracts.push({
      address: MEZO_TESTNET_CONTRACTS.VeMEZO,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veMezoTokenId],
      chainId: CHAIN_IDS.MEZO_TESTNET,
    });
  }

  const { data: lockData, isLoading: isLoadingLocks } = useReadContracts({
    contracts: lockContracts.length > 0 ? lockContracts : [
      // Placeholder when no token IDs available
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "totalSupply",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
    ],
    query: {
      enabled: isConnected && !!address && lockContracts.length > 0,
    },
  });

  // Process the data into positions
  const positions: UserPosition[] = [];

  // Debug: log raw data to console
  if (typeof window !== 'undefined') {
    console.log('Initial contract data:', data);
    console.log('veBTC token ID:', veBtcTokenId?.toString());
    console.log('veMEZO token ID:', veMezoTokenId?.toString());
    console.log('Lock data:', lockData);
  }

  if (data && address) {
    // veBTC Position - index 0 (balanceOf/NFT count), index 1 (tokenId)
    const veBtcNftCount = data[0]?.result as bigint | undefined;
    
    // Get locked amount from second read (dynamic index based on token availability)
    let veBtcLockedAmount: bigint | undefined;
    let veBtcLockEnd: bigint | undefined;
    const veBtcLockIndex = veBtcTokenId !== undefined ? 0 : -1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockDataArray = lockData as any[] | undefined;
    if (veBtcLockIndex >= 0 && lockDataArray?.[veBtcLockIndex]?.result) {
      const lockedResult = lockDataArray[veBtcLockIndex].result as [bigint, bigint] | { amount: bigint; end: bigint };
      if (Array.isArray(lockedResult)) {
        veBtcLockedAmount = lockedResult[0];
        veBtcLockEnd = lockedResult[1];
      } else if (typeof lockedResult === 'object') {
        veBtcLockedAmount = lockedResult.amount;
        veBtcLockEnd = lockedResult.end;
      }
    }
    
    // Only show if we have actual locked amount (not just NFT count)
    if (veBtcNftCount && veBtcNftCount > BigInt(0) && veBtcLockedAmount && veBtcLockedAmount > BigInt(0)) {
      // Handle potential int128 (could be stored as negative in some implementations)
      const rawAmount = veBtcLockedAmount < BigInt(0) ? -veBtcLockedAmount : veBtcLockedAmount;
      const amount = parseFloat(formatUnits(rawAmount, 18));
      const value = amount * BTC_PRICE_USD;
      positions.push({
        id: "vebtc-lock",
        name: "veBTC Lock",
        protocol: "Mezo",
        type: "lock",
        depositedAmount: amount.toFixed(6),
        depositedValue: value,
        currentAmount: amount.toFixed(6),
        currentValue: value,
        pnl: 0,
        pnlPercent: 0,
        apy: 15.8,
        token: "BTC",
        contractAddress: MEZO_TESTNET_CONTRACTS.VeBTC,
        unlockDate: veBtcLockEnd && veBtcLockEnd > BigInt(0) ? new Date(Number(veBtcLockEnd) * 1000) : undefined,
      });
    }

    // veMEZO Position - index 2 (balanceOf/NFT count), index 3 (tokenId)
    const veMezoNftCount = data[2]?.result as bigint | undefined;
    
    // Get locked amount from second read (dynamic index)
    let veMezoLockedAmount: bigint | undefined;
    let veMezoLockEnd: bigint | undefined;
    const veMezoLockIndex = veBtcTokenId !== undefined ? 1 : (veMezoTokenId !== undefined ? 0 : -1);
    if (veMezoLockIndex >= 0 && lockDataArray?.[veMezoLockIndex]?.result) {
      const lockedResult = lockDataArray[veMezoLockIndex].result as [bigint, bigint] | { amount: bigint; end: bigint };
      if (Array.isArray(lockedResult)) {
        veMezoLockedAmount = lockedResult[0];
        veMezoLockEnd = lockedResult[1];
      } else if (typeof lockedResult === 'object') {
        veMezoLockedAmount = lockedResult.amount;
        veMezoLockEnd = lockedResult.end;
      }
    }
    
    // Only show if we have actual locked amount
    if (veMezoNftCount && veMezoNftCount > BigInt(0) && veMezoLockedAmount && veMezoLockedAmount > BigInt(0)) {
      const rawAmount = veMezoLockedAmount < BigInt(0) ? -veMezoLockedAmount : veMezoLockedAmount;
      const amount = parseFloat(formatUnits(rawAmount, 18));
      positions.push({
        id: "vemezo-lock",
        name: "veMEZO Lock",
        protocol: "Mezo",
        type: "lock",
        depositedAmount: amount.toFixed(2),
        depositedValue: 0, // MEZO price TBD
        currentAmount: amount.toFixed(2),
        currentValue: 0,
        pnl: 0,
        pnlPercent: 0,
        apy: 0, // Boost multiplier, not direct APY
        token: "MEZO",
        contractAddress: MEZO_TESTNET_CONTRACTS.VeMEZO,
        unlockDate: veMezoLockEnd && veMezoLockEnd > BigInt(0) ? new Date(Number(veMezoLockEnd) * 1000) : undefined,
      });
    }

    // MUSD Vault Position - indices 4 (balanceOf), 5 (totalAssets), 6 (totalSupply)
    const vaultShares = data[4]?.result as bigint | undefined;
    const vaultTotalAssets = data[5]?.result as bigint | undefined;
    const vaultTotalSupply = data[6]?.result as bigint | undefined;
    
    if (vaultShares && vaultShares > BigInt(0) && vaultTotalAssets && vaultTotalSupply && vaultTotalSupply > BigInt(0)) {
      const shares = parseFloat(formatUnits(vaultShares, 18));
      const totalAssets = parseFloat(formatUnits(vaultTotalAssets, 18));
      const totalSupply = parseFloat(formatUnits(vaultTotalSupply, 18));
      const shareRatio = totalAssets / totalSupply;
      const currentAssets = shares * shareRatio;
      const value = currentAssets * MUSD_PRICE_USD;
      
      // Estimate deposited (shares at 1:1 ratio initially)
      const depositedValue = shares * MUSD_PRICE_USD;
      const pnl = value - depositedValue;
      const pnlPercent = depositedValue > 0 ? (pnl / depositedValue) * 100 : 0;

      positions.push({
        id: "musd-vault",
        name: "MUSD Core Vault",
        protocol: "Mezo",
        type: "vault",
        depositedAmount: shares.toFixed(2),
        depositedValue: depositedValue,
        currentAmount: currentAssets.toFixed(2),
        currentValue: value,
        pnl: pnl,
        pnlPercent: pnlPercent,
        apy: 8.5, // Placeholder - fetch from vault
        token: "MUSD",
        contractAddress: MEZO_TESTNET_CONTRACTS.MUSDVault,
      });
    }

    // MUSD Savings Rate Position - indices 7 (balanceOf), 8 (totalAssets), 9 (totalSupply)
    const savingsShares = data[7]?.result as bigint | undefined;
    const savingsTotalAssets = data[8]?.result as bigint | undefined;
    const savingsTotalSupply = data[9]?.result as bigint | undefined;
    
    // Show savings position even if totalAssets fails - use shares as fallback
    if (savingsShares && savingsShares > BigInt(0)) {
      const shares = parseFloat(formatUnits(savingsShares, 18));
      
      let currentAssets = shares; // Default: assume 1:1 ratio
      let shareRatio = 1;
      
      // If we have both totalAssets and totalSupply, calculate actual ratio
      if (savingsTotalAssets && savingsTotalSupply && savingsTotalSupply > BigInt(0)) {
        const totalAssets = parseFloat(formatUnits(savingsTotalAssets, 18));
        const totalSupply = parseFloat(formatUnits(savingsTotalSupply, 18));
        shareRatio = totalAssets / totalSupply;
        currentAssets = shares * shareRatio;
      } else if (savingsTotalSupply && savingsTotalSupply > BigInt(0)) {
        // If only totalSupply available, assume 1:1 for now
        currentAssets = shares;
      }
      
      const value = currentAssets * MUSD_PRICE_USD;
      const depositedValue = shares * MUSD_PRICE_USD;
      const pnl = value - depositedValue;
      const pnlPercent = depositedValue > 0 ? (pnl / depositedValue) * 100 : 0;

      positions.push({
        id: "musd-savings",
        name: "MUSD Savings Rate (sMUSD)",
        protocol: "Mezo",
        type: "savings",
        depositedAmount: shares.toFixed(2),
        depositedValue: depositedValue,
        currentAmount: currentAssets.toFixed(2),
        currentValue: value,
        pnl: pnl,
        pnlPercent: pnlPercent,
        apy: 5.2, // DSR-style savings rate
        token: "MUSD",
        contractAddress: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
      });
    }

    // MUSD Token Balance (not earning, just held) - index 10
    const musdBalance = data[10]?.result as bigint | undefined;
    if (musdBalance && musdBalance > BigInt(0)) {
      const amount = parseFloat(formatUnits(musdBalance, 18));
      if (amount > 0.01) { // Only show if meaningful balance
        positions.push({
          id: "musd-wallet",
          name: "MUSD in Wallet",
          protocol: "Mezo",
          type: "savings",
          depositedAmount: amount.toFixed(2),
          depositedValue: amount * MUSD_PRICE_USD,
          currentAmount: amount.toFixed(2),
          currentValue: amount * MUSD_PRICE_USD,
          pnl: 0,
          pnlPercent: 0,
          apy: 0,
          token: "MUSD",
          contractAddress: MEZO_TESTNET_CONTRACTS.MUSD,
        });
      }
    }
  }

  // Add native BTC balance if exists
  if (btcBalance && btcBalance.value > BigInt(0)) {
    const amount = parseFloat(formatUnits(btcBalance.value, 18));
    const value = amount * BTC_PRICE_USD;
    if (amount > 0.00001) { // Only show if meaningful
      positions.push({
        id: "btc-wallet",
        name: "BTC in Wallet",
        protocol: "Mezo",
        type: "savings",
        depositedAmount: amount.toFixed(6),
        depositedValue: value,
        currentAmount: amount.toFixed(6),
        currentValue: value,
        pnl: 0,
        pnlPercent: 0,
        apy: 0,
        token: "BTC",
        contractAddress: MEZO_TESTNET_CONTRACTS.BTC,
      });
    }
  }

  // Calculate totals
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalDeposited = positions.reduce((sum, p) => sum + p.depositedValue, 0);
  const totalPnL = totalValue - totalDeposited;
  const pnlPercent = totalDeposited > 0 ? (totalPnL / totalDeposited) * 100 : 0;
  
  // Calculate BTC equivalents
  const totalValueBTC = totalValue / BTC_PRICE_USD;
  const totalDepositedBTC = totalDeposited / BTC_PRICE_USD;

  return {
    totalValue,
    totalValueBTC,
    totalDeposited,
    totalDepositedBTC,
    totalPnL,
    pnlPercent,
    positions,
    isLoading: isLoading || isLoadingLocks,
    error: error as Error | null,
  };
}

// Hook to get just the summary stats
export function usePortfolioSummary() {
  const portfolio = usePositions();
  
  return {
    totalValue: portfolio.totalValue,
    totalDeposited: portfolio.totalDeposited,
    totalPnL: portfolio.totalPnL,
    pnlPercent: portfolio.pnlPercent,
    positionCount: portfolio.positions.length,
    isLoading: portfolio.isLoading,
    error: portfolio.error,
  };
}
