"use client";

import { useAccount, useReadContracts, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { getContracts, CHAIN_IDS, isValidContract } from "@/config/contracts";

// Pool Factory ABI - to discover all pools
const POOL_FACTORY_ABI = [
  {
    inputs: [],
    name: "allPoolsLength",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "allPools",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Voter ABI - to find gauges for pools
const VOTER_ABI = [
  {
    inputs: [],
    name: "length",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "pools",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "pool", type: "address" }],
    name: "gauges",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "gauge", type: "address" }],
    name: "isGauge",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Pool ABI - to get pool info
const POOL_ABI = [
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { name: "reserve0", type: "uint256" },
      { name: "reserve1", type: "uint256" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Gauge ABI - to get staked LP balance and rewards
const GAUGE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "earned",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface DiscoveredPool {
  address: string;
  name: string;
  symbol: string;
  token0: string;
  token1: string;
  userLpBalance: number;
  userStakedBalance: number;
  totalLpBalance: number; // LP in wallet + staked
  pendingRewards: number;
  gaugeAddress?: string;
  reserves?: {
    reserve0: number;
    reserve1: number;
  };
  totalSupply: number;
  estimatedValue: number;
}

export function usePoolDiscovery() {
  const { address, isConnected, chainId } = useAccount();
  const contracts = getContracts(chainId);
  const currentChainId = chainId || CHAIN_IDS.MEZO_MAINNET;

  const hasVoter = isValidContract(contracts.Voter);
  const hasPoolFactory = isValidContract(contracts.PoolFactory);

  // Step 1: Get number of pools from Voter
  const { data: poolCount } = useReadContract({
    address: contracts.Voter as `0x${string}`,
    abi: VOTER_ABI,
    functionName: "length",
    chainId: currentChainId,
    query: {
      enabled: hasVoter,
    },
  });

  // Step 2: Get all pool addresses (up to 20 pools for now)
  const poolIndices = poolCount ? Array.from({ length: Math.min(Number(poolCount), 20) }, (_, i) => i) : [];
  
  const poolAddressContracts = poolIndices.map(index => ({
    address: contracts.Voter as `0x${string}`,
    abi: VOTER_ABI,
    functionName: "pools" as const,
    args: [BigInt(index)],
    chainId: currentChainId,
  }));

  const { data: poolAddressesData } = useReadContracts({
    contracts: poolAddressContracts,
    query: {
      enabled: hasVoter && poolIndices.length > 0,
    },
  });

  const poolAddresses = poolAddressesData
    ?.map(d => d.result as `0x${string}` | undefined)
    .filter((addr): addr is `0x${string}` => !!addr && addr !== "0x0000000000000000000000000000000000000000") || [];

  // Step 3: Get gauge addresses for each pool
  const gaugeContracts = poolAddresses.map(poolAddr => ({
    address: contracts.Voter as `0x${string}`,
    abi: VOTER_ABI,
    functionName: "gauges" as const,
    args: [poolAddr],
    chainId: currentChainId,
  }));

  const { data: gaugeAddressesData } = useReadContracts({
    contracts: gaugeContracts,
    query: {
      enabled: poolAddresses.length > 0,
    },
  });

  const gaugeAddresses = gaugeAddressesData?.map(d => d.result as `0x${string}` | undefined) || [];

  // Step 4: Get pool info and user balances for each pool
  // Build a metadata array to track which pools have gauges
  const poolMeta = poolAddresses.map((poolAddr, idx) => {
    const gaugeAddr = gaugeAddresses[idx];
    const hasGauge = gaugeAddr && gaugeAddr !== "0x0000000000000000000000000000000000000000";
    return { poolAddr, gaugeAddr, hasGauge };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poolInfoContracts: any[] = [];

  poolMeta.forEach(({ poolAddr, gaugeAddr, hasGauge }) => {
    // Pool info calls (7 calls per pool)
    poolInfoContracts.push(
      { address: poolAddr, abi: POOL_ABI, functionName: "symbol", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "name", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "token0", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "token1", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "totalSupply", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "getReserves", chainId: currentChainId },
      { address: poolAddr, abi: POOL_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: currentChainId },
    );

    // If there's a gauge, also get staked balance and rewards (2 more calls)
    if (hasGauge && gaugeAddr) {
      poolInfoContracts.push(
        { address: gaugeAddr, abi: GAUGE_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: currentChainId },
        { address: gaugeAddr, abi: GAUGE_ABI, functionName: "earned", args: address ? [address] : undefined, chainId: currentChainId },
      );
    }
  });

  const { data: poolInfoData, isLoading } = useReadContracts({
    contracts: poolInfoContracts,
    query: {
      enabled: isConnected && !!address && poolInfoContracts.length > 0,
    },
  });

  // Step 5: Process pool data
  const pools: DiscoveredPool[] = [];
  
  if (poolInfoData && poolMeta.length > 0) {
    let dataIndex = 0;
    
    poolMeta.forEach(({ poolAddr, gaugeAddr, hasGauge }) => {
      const symbol = poolInfoData[dataIndex]?.result as string | undefined;
      const name = poolInfoData[dataIndex + 1]?.result as string | undefined;
      const token0 = poolInfoData[dataIndex + 2]?.result as string | undefined;
      const token1 = poolInfoData[dataIndex + 3]?.result as string | undefined;
      const totalSupply = poolInfoData[dataIndex + 4]?.result as bigint | undefined;
      const reserves = poolInfoData[dataIndex + 5]?.result as [bigint, bigint, number] | undefined;
      const lpBalance = poolInfoData[dataIndex + 6]?.result as bigint | undefined;
      
      dataIndex += 7;
      
      let stakedBalance: bigint | undefined;
      let pendingRewards: bigint | undefined;
      
      if (hasGauge) {
        stakedBalance = poolInfoData[dataIndex]?.result as bigint | undefined;
        pendingRewards = poolInfoData[dataIndex + 1]?.result as bigint | undefined;
        dataIndex += 2;
      }

      const userLpBalance = lpBalance ? parseFloat(formatUnits(lpBalance, 18)) : 0;
      const userStakedBalance = stakedBalance ? parseFloat(formatUnits(stakedBalance, 18)) : 0;
      const totalLpBalance = userLpBalance + userStakedBalance;
      const rewards = pendingRewards ? parseFloat(formatUnits(pendingRewards, 18)) : 0;
      const supply = totalSupply ? parseFloat(formatUnits(totalSupply, 18)) : 0;

      // Only include pools where user has a balance
      if (totalLpBalance > 0) {
        pools.push({
          address: poolAddr,
          name: name || `Unknown Pool`,
          symbol: symbol || "LP",
          token0: token0 || "",
          token1: token1 || "",
          userLpBalance,
          userStakedBalance,
          totalLpBalance,
          pendingRewards: rewards,
          gaugeAddress: hasGauge ? gaugeAddr : undefined,
          reserves: reserves ? {
            reserve0: parseFloat(formatUnits(reserves[0], 18)),
            reserve1: parseFloat(formatUnits(reserves[1], 18)),
          } : undefined,
          totalSupply: supply,
          estimatedValue: 0, // Will be calculated with price data
        });
      }
    });
  }

  return {
    pools,
    poolCount: poolCount ? Number(poolCount) : 0,
    isLoading,
    hasVoter,
  };
}
