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
  totalDeposited: number;
  totalPnL: number;
  pnlPercent: number;
  positions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
}

export function usePositions(): PortfolioData {
  const { address, isConnected } = useAccount();

  // Get native BTC balance
  const { data: btcBalance } = useBalance({
    address: address,
  });

  // First batch: Get token counts and IDs
  const { data: initialData, isLoading: isLoadingInitial } = useReadContracts({
    contracts: [
      // 0: veBTC - get NFT count
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 1: veBTC - get first token ID
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: address ? [address, 0n] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 2: veMEZO - get NFT count
      {
        address: MEZO_TESTNET_CONTRACTS.VeMEZO,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 3: veMEZO - get first token ID
      {
        address: MEZO_TESTNET_CONTRACTS.VeMEZO,
        abi: VOTING_ESCROW_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: address ? [address, 0n] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 4: MUSD Vault shares
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 5: MUSD Vault totalAssets
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "totalAssets",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 6: MUSD Vault totalSupply
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDVault,
        abi: VAULT_ABI,
        functionName: "totalSupply",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 7: MUSD Savings shares
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 8: MUSD Savings totalAssets
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "totalAssets",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 9: MUSD Savings totalSupply
      {
        address: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
        abi: VAULT_ABI,
        functionName: "totalSupply",
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 10: MUSD token balance
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

  // Extract token IDs from initial data
  const veBtcTokenId = initialData?.[1]?.result as bigint | undefined;
  const veMezoTokenId = initialData?.[3]?.result as bigint | undefined;

  // Second batch: Get locked amounts using token IDs
  const { data: lockData, isLoading: isLoadingLocks } = useReadContracts({
    contracts: [
      // 0: veBTC locked amount
      {
        address: MEZO_TESTNET_CONTRACTS.VeBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "locked",
        args: veBtcTokenId ? [veBtcTokenId] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
      // 1: veMEZO locked amount
      {
        address: MEZO_TESTNET_CONTRACTS.VeMEZO,
        abi: VOTING_ESCROW_ABI,
        functionName: "locked",
        args: veMezoTokenId ? [veMezoTokenId] : undefined,
        chainId: CHAIN_IDS.MEZO_TESTNET,
      },
    ],
    query: {
      enabled: isConnected && !!address && (!!veBtcTokenId || !!veMezoTokenId),
    },
  });

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('Initial contract data:', initialData);
    console.log('veBTC token ID:', veBtcTokenId?.toString());
    console.log('veMEZO token ID:', veMezoTokenId?.toString());
    console.log('Lock data:', lockData);
  }

  // Process the data into positions
  const positions: UserPosition[] = [];
  const isLoading = isLoadingInitial || isLoadingLocks;

  if (initialData && address) {
    // veBTC Position
    const veBtcNftCount = initialData[0]?.result as bigint | undefined;
    
    if (veBtcNftCount && veBtcNftCount > 0n && lockData?.[0]?.result) {
      // Parse locked data - could be array [amount, end] or object {amount, end}
      const lockedResult = lockData[0].result as [bigint, bigint] | { amount: bigint; end: bigint };
      let lockedAmount: bigint;
      let lockEnd: bigint;
      
      if (Array.isArray(lockedResult)) {
        lockedAmount = lockedResult[0];
        lockEnd = lockedResult[1];
      } else {
        lockedAmount = lockedResult.amount;
        lockEnd = lockedResult.end;
      }
      
      // Handle int128 which could be negative representation
      const amount = parseFloat(formatUnits(lockedAmount < 0n ? -lockedAmount : lockedAmount, 18));
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
        unlockDate: lockEnd > 0n ? new Date(Number(lockEnd) * 1000) : undefined,
      });
    }

    // veMEZO Position
    const veMezoNftCount = initialData[2]?.result as bigint | undefined;
    
    if (veMezoNftCount && veMezoNftCount > 0n && lockData?.[1]?.result) {
      const lockedResult = lockData[1].result as [bigint, bigint] | { amount: bigint; end: bigint };
      let lockedAmount: bigint;
      let lockEnd: bigint;
      
      if (Array.isArray(lockedResult)) {
        lockedAmount = lockedResult[0];
        lockEnd = lockedResult[1];
      } else {
        lockedAmount = lockedResult.amount;
        lockEnd = lockedResult.end;
      }
      
      const amount = parseFloat(formatUnits(lockedAmount < 0n ? -lockedAmount : lockedAmount, 18));
      
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
        apy: 0,
        token: "MEZO",
        contractAddress: MEZO_TESTNET_CONTRACTS.VeMEZO,
        unlockDate: lockEnd > 0n ? new Date(Number(lockEnd) * 1000) : undefined,
      });
    }

    // MUSD Vault Position
    const vaultShares = initialData[4]?.result as bigint | undefined;
    const vaultTotalAssets = initialData[5]?.result as bigint | undefined;
    const vaultTotalSupply = initialData[6]?.result as bigint | undefined;
    
    if (vaultShares && vaultShares > 0n && vaultTotalAssets && vaultTotalSupply && vaultTotalSupply > 0n) {
      const shares = parseFloat(formatUnits(vaultShares, 18));
      const totalAssets = parseFloat(formatUnits(vaultTotalAssets, 18));
      const totalSupply = parseFloat(formatUnits(vaultTotalSupply, 18));
      const shareRatio = totalAssets / totalSupply;
      const currentAssets = shares * shareRatio;
      const value = currentAssets * MUSD_PRICE_USD;
      
      const depositedValue = shares * MUSD_PRICE_USD;
      const pnl = value - depositedValue;
      const pnlPercent = depositedValue > 0 ? (pnl / depositedValue) * 100 : 0;

      positions.push({
        id: "musd-vault",
        name: "MUSD Vault",
        protocol: "Mezo",
        type: "vault",
        depositedAmount: shares.toFixed(2),
        depositedValue: depositedValue,
        currentAmount: currentAssets.toFixed(2),
        currentValue: value,
        pnl: pnl,
        pnlPercent: pnlPercent,
        apy: 8.5,
        token: "MUSD",
        contractAddress: MEZO_TESTNET_CONTRACTS.MUSDVault,
      });
    }

    // MUSD Savings Rate Position
    const savingsShares = initialData[7]?.result as bigint | undefined;
    const savingsTotalAssets = initialData[8]?.result as bigint | undefined;
    const savingsTotalSupply = initialData[9]?.result as bigint | undefined;
    
    if (savingsShares && savingsShares > 0n && savingsTotalAssets && savingsTotalSupply && savingsTotalSupply > 0n) {
      const shares = parseFloat(formatUnits(savingsShares, 18));
      const totalAssets = parseFloat(formatUnits(savingsTotalAssets, 18));
      const totalSupply = parseFloat(formatUnits(savingsTotalSupply, 18));
      const shareRatio = totalAssets / totalSupply;
      const currentAssets = shares * shareRatio;
      const value = currentAssets * MUSD_PRICE_USD;
      
      const depositedValue = shares * MUSD_PRICE_USD;
      const pnl = value - depositedValue;
      const pnlPercent = depositedValue > 0 ? (pnl / depositedValue) * 100 : 0;

      positions.push({
        id: "musd-savings",
        name: "MUSD Savings",
        protocol: "Mezo",
        type: "savings",
        depositedAmount: shares.toFixed(2),
        depositedValue: depositedValue,
        currentAmount: currentAssets.toFixed(2),
        currentValue: value,
        pnl: pnl,
        pnlPercent: pnlPercent,
        apy: 5.2,
        token: "MUSD",
        contractAddress: MEZO_TESTNET_CONTRACTS.MUSDSavingsRate,
      });
    }

    // MUSD Token Balance
    const musdBalance = initialData[10]?.result as bigint | undefined;
    if (musdBalance && musdBalance > 0n) {
      const amount = parseFloat(formatUnits(musdBalance, 18));
      if (amount > 0.01) {
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

  // Add native BTC balance
  if (btcBalance && btcBalance.value > 0n) {
    const amount = parseFloat(formatUnits(btcBalance.value, 18));
    const value = amount * BTC_PRICE_USD;
    if (amount > 0.00001) {
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

  return {
    totalValue,
    totalDeposited,
    totalPnL,
    pnlPercent,
    positions,
    isLoading,
    error: null,
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
