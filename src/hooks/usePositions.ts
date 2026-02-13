"use client";

import { useAccount, useReadContracts, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { getContracts, CHAIN_IDS, isValidContract } from "@/config/contracts";
import { ERC20_ABI, VOTING_ESCROW_ABI, VAULT_ABI, LP_POOL_ABI, GAUGE_ABI } from "@/config/abis";
import { useBTCPrice } from "@/lib/price-service";

// MUSD is a stablecoin pegged to $1
const MUSD_PRICE_USD = 1;

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
  rewards?: {
    pending: number;
    token: string;
  };
}

export interface PortfolioData {
  totalValue: number;
  totalValueBTC: number;
  totalDeposited: number;
  totalDepositedBTC: number;
  totalPnL: number;
  pnlPercent: number;
  positions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
  btcPrice: number;
  btcPriceNote: string;
  btcChange24h: number;
  priceSource: string;
  totalRewardsPending: number;
}

// Rewards Distributor ABI
const REWARDS_DISTRIBUTOR_ABI = [
  {
    inputs: [{ name: "_tokenId", type: "uint256" }],
    name: "claimable",
    outputs: [{ name: "claimable_", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function usePositions(): PortfolioData {
  const { address, isConnected, chainId } = useAccount();
  const { price: btcPriceData, isLoading: isPriceLoading } = useBTCPrice();
  
  // Use live BTC price, fallback to estimate
  const BTC_PRICE_USD = btcPriceData?.btc || 104000;
  
  // Get the appropriate contracts for the current chain
  const contracts = getContracts(chainId);
  const currentChainId = chainId || CHAIN_IDS.MEZO_MAINNET;
  
  // Check which contracts are valid (not zero address)
  const hasVeBTC = isValidContract(contracts.VeBTC);
  const hasVeMEZO = isValidContract(contracts.VeMEZO);
  const hasMUSDVault = isValidContract(contracts.MUSDVault);
  const hasMUSDSavings = isValidContract(contracts.MUSDSavingsRate);
  const hasRewardsDistributor = isValidContract(contracts.VeBTCRewardsDistributor || "0x0000000000000000000000000000000000000000");

  // Get native BTC balance
  const { data: btcBalance } = useBalance({
    address: address,
  });

  // Build contract calls dynamically - only include valid contracts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractCalls: any[] = [];
  
  // Track indices for each contract type
  const indices = {
    veBtcBalanceOf: -1,
    veBtcTokenId: -1,
    veMezoBalanceOf: -1,
    veMezoTokenId: -1,
    musdVaultBalance: -1,
    musdVaultAssets: -1,
    musdVaultSupply: -1,
    musdSavingsBalance: -1,
    musdSavingsAssets: -1,
    musdSavingsSupply: -1,
    musdBalance: -1,
    musdBtcPoolBalance: -1,
    musdBtcPoolSupply: -1,
    musdBtcPoolReserves: -1,
    musdUsdcPoolBalance: -1,
    musdUsdcPoolSupply: -1,
  };

  // veBTC contracts
  if (hasVeBTC) {
    indices.veBtcBalanceOf = contractCalls.length;
    contractCalls.push({
      address: contracts.VeBTC,
      abi: VOTING_ESCROW_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.veBtcTokenId = contractCalls.length;
    contractCalls.push({
      address: contracts.VeBTC,
      abi: VOTING_ESCROW_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: address ? [address, BigInt(0)] : undefined,
      chainId: currentChainId,
    });
  }

  // veMEZO contracts (skip if zero address)
  if (hasVeMEZO) {
    indices.veMezoBalanceOf = contractCalls.length;
    contractCalls.push({
      address: contracts.VeMEZO,
      abi: VOTING_ESCROW_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.veMezoTokenId = contractCalls.length;
    contractCalls.push({
      address: contracts.VeMEZO,
      abi: VOTING_ESCROW_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: address ? [address, BigInt(0)] : undefined,
      chainId: currentChainId,
    });
  }

  // MUSD Vault (skip if zero address)
  if (hasMUSDVault) {
    indices.musdVaultBalance = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDVault,
      abi: VAULT_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.musdVaultAssets = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDVault,
      abi: VAULT_ABI,
      functionName: "totalAssets",
      chainId: currentChainId,
    });
    indices.musdVaultSupply = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDVault,
      abi: VAULT_ABI,
      functionName: "totalSupply",
      chainId: currentChainId,
    });
  }

  // MUSD Savings Rate (skip if zero address)
  if (hasMUSDSavings) {
    indices.musdSavingsBalance = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDSavingsRate,
      abi: VAULT_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.musdSavingsAssets = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDSavingsRate,
      abi: VAULT_ABI,
      functionName: "totalAssets",
      chainId: currentChainId,
    });
    indices.musdSavingsSupply = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSDSavingsRate,
      abi: VAULT_ABI,
      functionName: "totalSupply",
      chainId: currentChainId,
    });
  }

  // MUSD token balance (always valid)
  indices.musdBalance = contractCalls.length;
  contractCalls.push({
    address: contracts.MUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: currentChainId,
  });

  // LP Pool positions - MUSD/BTC Pool (vAMM-BTC/MUSD)
  if (isValidContract(contracts.MUSD_BTC_Pool)) {
    indices.musdBtcPoolBalance = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSD_BTC_Pool,
      abi: LP_POOL_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.musdBtcPoolSupply = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSD_BTC_Pool,
      abi: LP_POOL_ABI,
      functionName: "totalSupply",
      chainId: currentChainId,
    });
    indices.musdBtcPoolReserves = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSD_BTC_Pool,
      abi: LP_POOL_ABI,
      functionName: "getReserves",
      chainId: currentChainId,
    });
  }

  // LP Pool positions - MUSD/USDC Pool
  if (isValidContract(contracts.MUSD_USDC_Pool)) {
    indices.musdUsdcPoolBalance = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSD_USDC_Pool,
      abi: LP_POOL_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    });
    indices.musdUsdcPoolSupply = contractCalls.length;
    contractCalls.push({
      address: contracts.MUSD_USDC_Pool,
      abi: LP_POOL_ABI,
      functionName: "totalSupply",
      chainId: currentChainId,
    });
  }

  // Read from contracts
  const { data, isLoading, error } = useReadContracts({
    contracts: contractCalls.length > 0 ? contractCalls : [{
      // Placeholder if no contracts
      address: contracts.MUSD,
      abi: ERC20_ABI,
      functionName: "decimals",
      chainId: currentChainId,
    }],
    query: {
      enabled: isConnected && !!address && contractCalls.length > 0,
    },
  });

  // Extract token IDs from initial data for second read
  const veBtcTokenId = indices.veBtcTokenId >= 0 ? data?.[indices.veBtcTokenId]?.result as bigint | undefined : undefined;
  const veMezoTokenId = indices.veMezoTokenId >= 0 ? data?.[indices.veMezoTokenId]?.result as bigint | undefined : undefined;

  // Second batch: Get locked amounts using token IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lockContracts: any[] = [];
  let veBtcLockIdx = -1;
  let veMezoLockIdx = -1;
  let veBtcRewardsIdx = -1;
  
  if (hasVeBTC && veBtcTokenId !== undefined) {
    veBtcLockIdx = lockContracts.length;
    lockContracts.push({
      address: contracts.VeBTC,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veBtcTokenId],
      chainId: currentChainId,
    });
    
    // Also get claimable rewards if distributor exists
    if (hasRewardsDistributor && contracts.VeBTCRewardsDistributor) {
      veBtcRewardsIdx = lockContracts.length;
      lockContracts.push({
        address: contracts.VeBTCRewardsDistributor,
        abi: REWARDS_DISTRIBUTOR_ABI,
        functionName: "claimable",
        args: [veBtcTokenId],
        chainId: currentChainId,
      });
    }
  }
  if (hasVeMEZO && veMezoTokenId !== undefined) {
    veMezoLockIdx = lockContracts.length;
    lockContracts.push({
      address: contracts.VeMEZO,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veMezoTokenId],
      chainId: currentChainId,
    });
  }

  const { data: lockData, isLoading: isLoadingLocks } = useReadContracts({
    contracts: lockContracts.length > 0 ? lockContracts : [
      // Placeholder when no token IDs available
      {
        address: contracts.MUSD,
        abi: ERC20_ABI,
        functionName: "decimals",
        chainId: currentChainId,
      },
    ],
    query: {
      enabled: isConnected && !!address && lockContracts.length > 0,
    },
  });

  // Process the data into positions
  const positions: UserPosition[] = [];
  let totalRewardsPending = 0;

  // Debug: log raw data to console
  if (typeof window !== 'undefined') {
    console.log('Chain ID:', currentChainId);
    console.log('BTC Price:', BTC_PRICE_USD);
    console.log('Contract indices:', indices);
    console.log('Initial contract data:', data);
    console.log('veBTC token ID:', veBtcTokenId?.toString());
    console.log('veMEZO token ID:', veMezoTokenId?.toString());
    console.log('Lock data:', lockData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lockDataArray = lockData as any[] | undefined;

  if (data && address) {
    // veBTC Position
    if (hasVeBTC && indices.veBtcBalanceOf >= 0) {
      const veBtcNftCount = data[indices.veBtcBalanceOf]?.result as bigint | undefined;
      
      // Get locked amount from second read
      let veBtcLockedAmount: bigint | undefined;
      let veBtcLockEnd: bigint | undefined;
      
      if (veBtcLockIdx >= 0 && lockDataArray?.[veBtcLockIdx]?.result) {
        const lockedResult = lockDataArray[veBtcLockIdx].result as [bigint, bigint] | [bigint, bigint, boolean] | { amount: bigint; end: bigint };
        if (Array.isArray(lockedResult)) {
          veBtcLockedAmount = lockedResult[0];
          veBtcLockEnd = lockedResult[1];
        } else if (typeof lockedResult === 'object') {
          veBtcLockedAmount = lockedResult.amount;
          veBtcLockEnd = lockedResult.end;
        }
      }
      
      // Get claimable rewards
      let veBtcRewards = BigInt(0);
      if (veBtcRewardsIdx >= 0 && lockDataArray?.[veBtcRewardsIdx]?.result) {
        veBtcRewards = lockDataArray[veBtcRewardsIdx].result as bigint;
      }
      
      // Only show if we have actual locked amount (not just NFT count)
      if (veBtcNftCount && veBtcNftCount > BigInt(0) && veBtcLockedAmount && veBtcLockedAmount > BigInt(0)) {
        // Handle potential int128 (could be stored as negative in some implementations)
        const rawAmount = veBtcLockedAmount < BigInt(0) ? -veBtcLockedAmount : veBtcLockedAmount;
        const amount = parseFloat(formatUnits(rawAmount, 18));
        const value = amount * BTC_PRICE_USD;
        const rewardsAmount = parseFloat(formatUnits(veBtcRewards, 18));
        const rewardsValue = rewardsAmount * BTC_PRICE_USD;
        totalRewardsPending += rewardsValue;
        
        positions.push({
          id: "vebtc-lock",
          name: "veBTC Lock",
          protocol: "Mezo",
          type: "lock",
          depositedAmount: amount.toFixed(6),
          depositedValue: value,
          currentAmount: amount.toFixed(6),
          currentValue: value,
          pnl: rewardsValue, // Rewards are the PnL for locks
          pnlPercent: value > 0 ? (rewardsValue / value) * 100 : 0,
          apy: 15.8,
          token: "BTC",
          contractAddress: contracts.VeBTC,
          unlockDate: veBtcLockEnd && veBtcLockEnd > BigInt(0) ? new Date(Number(veBtcLockEnd) * 1000) : undefined,
          rewards: rewardsAmount > 0 ? { pending: rewardsAmount, token: "BTC" } : undefined,
        });
      }
    }

    // veMEZO Position
    if (hasVeMEZO && indices.veMezoBalanceOf >= 0) {
      const veMezoNftCount = data[indices.veMezoBalanceOf]?.result as bigint | undefined;
      
      // Get locked amount from second read
      let veMezoLockedAmount: bigint | undefined;
      let veMezoLockEnd: bigint | undefined;
      
      if (veMezoLockIdx >= 0 && lockDataArray?.[veMezoLockIdx]?.result) {
        const lockedResult = lockDataArray[veMezoLockIdx].result as [bigint, bigint] | { amount: bigint; end: bigint };
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
          contractAddress: contracts.VeMEZO,
          unlockDate: veMezoLockEnd && veMezoLockEnd > BigInt(0) ? new Date(Number(veMezoLockEnd) * 1000) : undefined,
        });
      }
    }

    // MUSD Vault Position
    if (hasMUSDVault && indices.musdVaultBalance >= 0) {
      const vaultShares = data[indices.musdVaultBalance]?.result as bigint | undefined;
      const vaultTotalAssets = indices.musdVaultAssets >= 0 ? data[indices.musdVaultAssets]?.result as bigint | undefined : undefined;
      const vaultTotalSupply = indices.musdVaultSupply >= 0 ? data[indices.musdVaultSupply]?.result as bigint | undefined : undefined;
      
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
          name: "MUSD Core Vault (August)",
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
          contractAddress: contracts.MUSDVault,
        });
      }
    }

    // MUSD Savings Rate Position
    if (hasMUSDSavings && indices.musdSavingsBalance >= 0) {
      const savingsShares = data[indices.musdSavingsBalance]?.result as bigint | undefined;
      const savingsTotalAssets = indices.musdSavingsAssets >= 0 ? data[indices.musdSavingsAssets]?.result as bigint | undefined : undefined;
      const savingsTotalSupply = indices.musdSavingsSupply >= 0 ? data[indices.musdSavingsSupply]?.result as bigint | undefined : undefined;
      
      // Show savings position even if totalAssets fails - use shares as fallback
      if (savingsShares && savingsShares > BigInt(0)) {
        const shares = parseFloat(formatUnits(savingsShares, 18));
        
        let currentAssets = shares; // Default: assume 1:1 ratio
        
        // If we have both totalAssets and totalSupply, calculate actual ratio
        if (savingsTotalAssets && savingsTotalSupply && savingsTotalSupply > BigInt(0)) {
          const totalAssets = parseFloat(formatUnits(savingsTotalAssets, 18));
          const totalSupply = parseFloat(formatUnits(savingsTotalSupply, 18));
          const shareRatio = totalAssets / totalSupply;
          currentAssets = shares * shareRatio;
        }
        
        const value = currentAssets * MUSD_PRICE_USD;
        const depositedValue = shares * MUSD_PRICE_USD;
        const pnl = value - depositedValue;
        const pnlPercent = depositedValue > 0 ? (pnl / depositedValue) * 100 : 0;

        positions.push({
          id: "musd-savings",
          name: "MUSD Savings Rate Vault (sMUSD)",
          protocol: "Mezo",
          type: "savings",
          depositedAmount: shares.toFixed(2),
          depositedValue: depositedValue,
          currentAmount: currentAssets.toFixed(2),
          currentValue: value,
          pnl: pnl,
          pnlPercent: pnlPercent,
          apy: 26.69, // From user screenshot
          token: "sMUSD",
          contractAddress: contracts.MUSDSavingsRate,
        });
      }
    }

    // MUSD Token Balance (not earning, just held)
    if (indices.musdBalance >= 0) {
      const musdBalance = data[indices.musdBalance]?.result as bigint | undefined;
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
            contractAddress: contracts.MUSD,
          });
        }
      }
    }

    // LP Pool - MUSD/BTC (vAMM-BTC/MUSD)
    if (indices.musdBtcPoolBalance >= 0) {
      const lpBalance = data[indices.musdBtcPoolBalance]?.result as bigint | undefined;
      const lpSupply = indices.musdBtcPoolSupply >= 0 ? data[indices.musdBtcPoolSupply]?.result as bigint | undefined : undefined;
      const reserves = indices.musdBtcPoolReserves >= 0 ? data[indices.musdBtcPoolReserves]?.result as [bigint, bigint, number] | undefined : undefined;
      
      if (lpBalance && lpBalance > BigInt(0)) {
        const amount = parseFloat(formatUnits(lpBalance, 18));
        
        // Calculate LP value from reserves
        let estimatedValue = 0;
        let btcShare = 0;
        let musdShare = 0;
        
        if (reserves && lpSupply && lpSupply > BigInt(0)) {
          const reserve0 = parseFloat(formatUnits(reserves[0], 18)); // BTC or MUSD
          const reserve1 = parseFloat(formatUnits(reserves[1], 18)); // BTC or MUSD
          const totalSupply = parseFloat(formatUnits(lpSupply, 18));
          const shareRatio = amount / totalSupply;
          
          // Assuming reserve0 is BTC, reserve1 is MUSD (verify from pool)
          btcShare = reserve0 * shareRatio;
          musdShare = reserve1 * shareRatio;
          
          // Value = BTC value + MUSD value
          estimatedValue = (btcShare * BTC_PRICE_USD) + (musdShare * MUSD_PRICE_USD);
        } else {
          // Fallback: rough estimate
          estimatedValue = amount * 500; // Placeholder
        }
        
        positions.push({
          id: "lp-musd-btc",
          name: "BTC/MUSD Pool LP",
          protocol: "Mezo DEX",
          type: "lp",
          depositedAmount: `${amount.toFixed(6)} LP`,
          depositedValue: estimatedValue,
          currentAmount: btcShare > 0 ? `${btcShare.toFixed(6)} BTC / ${musdShare.toFixed(2)} MUSD` : `${amount.toFixed(6)} LP`,
          currentValue: estimatedValue,
          pnl: 0, // Need historical data to calculate
          pnlPercent: 0,
          apy: 12.5, // Placeholder
          token: "LP",
          contractAddress: contracts.MUSD_BTC_Pool,
        });
      }
    }

    // LP Pool - MUSD/USDC
    if (indices.musdUsdcPoolBalance >= 0) {
      const lpBalance = data[indices.musdUsdcPoolBalance]?.result as bigint | undefined;
      
      if (lpBalance && lpBalance > BigInt(0)) {
        const amount = parseFloat(formatUnits(lpBalance, 18));
        // Estimate LP value (simplified - both are stablecoins so ~$2 per LP token)
        const estimatedValue = amount * 2;
        
        positions.push({
          id: "lp-musd-usdc",
          name: "MUSD/USDC Pool LP",
          protocol: "Mezo DEX",
          type: "lp",
          depositedAmount: amount.toFixed(2),
          depositedValue: estimatedValue,
          currentAmount: amount.toFixed(2),
          currentValue: estimatedValue,
          pnl: 0,
          pnlPercent: 0,
          apy: 8.2, // Placeholder
          token: "LP",
          contractAddress: contracts.MUSD_USDC_Pool,
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
        contractAddress: contracts.BTC,
      });
    }
  }

  // Calculate totals
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalDeposited = positions.reduce((sum, p) => sum + p.depositedValue, 0);
  const totalPnL = totalValue - totalDeposited + totalRewardsPending;
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
    isLoading: isLoading || isLoadingLocks || isPriceLoading,
    error: error as Error | null,
    btcPrice: BTC_PRICE_USD,
    btcPriceNote: btcPriceData?.source === 'CoinGecko' ? 'Live price from CoinGecko' : 'Estimated price',
    btcChange24h: btcPriceData?.btcChange24h || 0,
    priceSource: btcPriceData?.source || 'Fallback',
    totalRewardsPending,
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
    btcPrice: portfolio.btcPrice,
  };
}
