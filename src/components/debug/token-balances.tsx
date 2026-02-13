"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { getContracts, CHAIN_IDS } from "@/config/contracts";
import { ERC20_ABI, VAULT_ABI } from "@/config/abis";

// Simple ERC20 balance ABI
const BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
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
] as const;

// ERC4626 Vault ABI for claimable rewards
const VAULT_READ_ABI = [
  ...BALANCE_ABI,
  {
    inputs: [],
    name: "totalAssets",
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
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "maxWithdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface TokenInfo {
  address: string;
  name: string;
  balance?: string;
  symbol?: string;
  decimals?: number;
  error?: string;
  vaultInfo?: {
    totalAssets?: string;
    totalSupply?: string;
    maxWithdraw?: string;
    convertedAssets?: string;
  };
}

export function TokenBalancesDebug() {
  const { address, isConnected, chainId } = useAccount();
  const contracts = getContracts(chainId);
  const currentChainId = chainId || CHAIN_IDS.MEZO_MAINNET;

  // List of tokens to check
  const tokensToCheck = [
    { address: contracts.MUSD, name: "MUSD Token" },
    { address: contracts.MUSDSavingsRate, name: "MUSD Savings Rate (sMUSD)" },
    { address: contracts.MUSDVault, name: "MUSD Vault (August)" },
    { address: contracts.MUSD_BTC_Pool, name: "BTC/MUSD LP Pool" },
    { address: contracts.MUSD_USDC_Pool, name: "MUSD/USDC LP Pool" },
  ].filter(t => t.address && t.address !== "0x0000000000000000000000000000000000000000");

  // Build contract calls for all tokens
  const contractCalls = tokensToCheck.flatMap(token => [
    // balanceOf
    {
      address: token.address as `0x${string}`,
      abi: BALANCE_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    },
    // symbol
    {
      address: token.address as `0x${string}`,
      abi: BALANCE_ABI,
      functionName: "symbol",
      chainId: currentChainId,
    },
    // decimals
    {
      address: token.address as `0x${string}`,
      abi: BALANCE_ABI,
      functionName: "decimals",
      chainId: currentChainId,
    },
    // name
    {
      address: token.address as `0x${string}`,
      abi: BALANCE_ABI,
      functionName: "name",
      chainId: currentChainId,
    },
    // For vaults: totalAssets
    {
      address: token.address as `0x${string}`,
      abi: VAULT_READ_ABI,
      functionName: "totalAssets",
      chainId: currentChainId,
    },
    // For vaults: totalSupply
    {
      address: token.address as `0x${string}`,
      abi: VAULT_READ_ABI,
      functionName: "totalSupply",
      chainId: currentChainId,
    },
    // For vaults: maxWithdraw
    {
      address: token.address as `0x${string}`,
      abi: VAULT_READ_ABI,
      functionName: "maxWithdraw",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    },
  ]);

  const { data, isLoading, error } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Process results
  const tokenInfos: TokenInfo[] = tokensToCheck.map((token, idx) => {
    const baseIdx = idx * 7;
    const balanceResult = data?.[baseIdx];
    const symbolResult = data?.[baseIdx + 1];
    const decimalsResult = data?.[baseIdx + 2];
    const nameResult = data?.[baseIdx + 3];
    const totalAssetsResult = data?.[baseIdx + 4];
    const totalSupplyResult = data?.[baseIdx + 5];
    const maxWithdrawResult = data?.[baseIdx + 6];

    const decimals = decimalsResult?.result as number | undefined ?? 18;
    const balance = balanceResult?.result as bigint | undefined;
    
    return {
      address: token.address,
      name: token.name,
      balance: balance !== undefined ? formatUnits(balance, decimals) : undefined,
      symbol: symbolResult?.result as string | undefined,
      decimals,
      error: balanceResult?.error?.message,
      vaultInfo: {
        totalAssets: totalAssetsResult?.result !== undefined 
          ? formatUnits(totalAssetsResult.result as bigint, decimals) 
          : undefined,
        totalSupply: totalSupplyResult?.result !== undefined 
          ? formatUnits(totalSupplyResult.result as bigint, decimals) 
          : undefined,
        maxWithdraw: maxWithdrawResult?.result !== undefined 
          ? formatUnits(maxWithdrawResult.result as bigint, decimals) 
          : undefined,
      },
    };
  });

  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Connect wallet to see token balances</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
      <h3 className="text-lg font-bold mb-4 text-yellow-400">🔍 Debug: Token Balances</h3>
      
      <div className="mb-4">
        <p>Chain ID: {chainId}</p>
        <p>Address: {address}</p>
      </div>

      {isLoading && <p className="text-blue-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      <div className="space-y-4">
        {tokenInfos.map((token, idx) => (
          <div key={idx} className="border border-gray-700 p-3 rounded">
            <p className="text-yellow-300 font-bold">{token.name}</p>
            <p className="text-gray-400 text-xs break-all">{token.address}</p>
            
            {token.error ? (
              <p className="text-red-400">Error: {token.error}</p>
            ) : (
              <>
                <p>
                  <span className="text-gray-400">Balance:</span>{" "}
                  <span className="text-green-400">{token.balance || "0"}</span>{" "}
                  <span className="text-gray-500">{token.symbol}</span>
                </p>
                {token.vaultInfo?.totalAssets && (
                  <p>
                    <span className="text-gray-400">Total Assets:</span>{" "}
                    <span className="text-blue-400">{token.vaultInfo.totalAssets}</span>
                  </p>
                )}
                {token.vaultInfo?.totalSupply && (
                  <p>
                    <span className="text-gray-400">Total Supply:</span>{" "}
                    <span className="text-blue-400">{token.vaultInfo.totalSupply}</span>
                  </p>
                )}
                {token.vaultInfo?.maxWithdraw && (
                  <p>
                    <span className="text-gray-400">Max Withdraw (Your claimable):</span>{" "}
                    <span className="text-purple-400">{token.vaultInfo.maxWithdraw}</span>
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Raw data logged to console for detailed inspection</p>
      </div>
    </div>
  );
}
