"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { getContracts, CHAIN_IDS, isValidContract } from "@/config/contracts";
import { ERC20_ABI, VAULT_ABI, VOTING_ESCROW_ABI } from "@/config/abis";

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

interface VeLockInfo {
  address: string;
  name: string;
  nftCount?: number;
  tokenId?: string;
  lockedAmount?: string;
  lockEnd?: string;
  lockEndDate?: string;
  error?: string;
}

export function TokenBalancesDebug() {
  const { address, isConnected, chainId } = useAccount();
  const contracts = getContracts(chainId);
  const currentChainId = chainId || CHAIN_IDS.MEZO_MAINNET;

  // Check which VE contracts are available
  const hasVeBTC = isValidContract(contracts.VeBTC);
  const hasVeMEZO = isValidContract(contracts.VeMEZO);

  // List of tokens to check
  const tokensToCheck = [
    { address: contracts.MUSD, name: "MUSD Token" },
    { address: contracts.MUSDSavingsRate, name: "MUSD Savings Rate (sMUSD)" },
    { address: contracts.MUSDVault, name: "MUSD Vault (August)" },
    { address: contracts.MUSD_BTC_Pool, name: "BTC/MUSD LP Pool" },
    { address: contracts.MUSD_USDC_Pool, name: "MUSD/USDC LP Pool" },
  ].filter(t => t.address && t.address !== "0x0000000000000000000000000000000000000000");

  // VE Lock contracts to check
  const veLocksToCheck: { address: string; name: string }[] = [];
  if (hasVeBTC) {
    veLocksToCheck.push({ address: contracts.VeBTC, name: "veBTC Lock" });
  }
  if (hasVeMEZO) {
    veLocksToCheck.push({ address: contracts.VeMEZO, name: "veMEZO Lock" });
  }

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

  // VE Lock contract calls (NFT-based)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const veLockCalls: any[] = veLocksToCheck.flatMap(ve => [
    // balanceOf (returns NFT count)
    {
      address: ve.address as `0x${string}`,
      abi: VOTING_ESCROW_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: currentChainId,
    },
    // tokenOfOwnerByIndex (get first token ID)
    {
      address: ve.address as `0x${string}`,
      abi: VOTING_ESCROW_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: address ? [address, BigInt(0)] : undefined,
      chainId: currentChainId,
    },
  ]);

  const { data: veData } = useReadContracts({
    contracts: veLockCalls.length > 0 ? veLockCalls : undefined,
    query: {
      enabled: isConnected && !!address && veLockCalls.length > 0,
    },
  });

  // Extract token IDs for second batch
  const veBtcTokenId = hasVeBTC && veData?.[1]?.result ? veData[1].result as bigint : undefined;
  const veMezoTokenId = hasVeMEZO && veData?.[3]?.result ? veData[3].result as bigint : undefined;

  // Second batch: Get locked() data using token IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lockDataCalls: any[] = [];
  if (hasVeBTC && veBtcTokenId !== undefined) {
    lockDataCalls.push({
      address: contracts.VeBTC as `0x${string}`,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veBtcTokenId],
      chainId: currentChainId,
    });
  }
  if (hasVeMEZO && veMezoTokenId !== undefined) {
    lockDataCalls.push({
      address: contracts.VeMEZO as `0x${string}`,
      abi: VOTING_ESCROW_ABI,
      functionName: "locked",
      args: [veMezoTokenId],
      chainId: currentChainId,
    });
  }

  const { data: lockData } = useReadContracts({
    contracts: lockDataCalls.length > 0 ? lockDataCalls : undefined,
    query: {
      enabled: isConnected && !!address && lockDataCalls.length > 0,
    },
  });

  // Process VE lock info
  const veLockInfos: VeLockInfo[] = veLocksToCheck.map((ve, idx) => {
    const baseIdx = idx * 2;
    const nftCountResult = veData?.[baseIdx];
    const tokenIdResult = veData?.[baseIdx + 1];

    const nftCount = nftCountResult?.result as bigint | undefined;
    const tokenId = tokenIdResult?.result as bigint | undefined;

    // Get lock data from second batch
    let lockedAmount: string | undefined;
    let lockEnd: string | undefined;
    let lockEndDate: string | undefined;

    // Determine which lock data index to use
    const lockIdx = idx === 0 && hasVeBTC && veBtcTokenId !== undefined ? 0 :
                   idx === 1 && hasVeMEZO && veMezoTokenId !== undefined ? (hasVeBTC && veBtcTokenId !== undefined ? 1 : 0) :
                   -1;

    if (lockIdx >= 0 && lockData?.[lockIdx]?.result) {
      const locked = lockData[lockIdx].result as [bigint, bigint] | { amount: bigint; end: bigint };
      if (Array.isArray(locked)) {
        const rawAmount = locked[0] < BigInt(0) ? -locked[0] : locked[0];
        lockedAmount = formatUnits(rawAmount, 18);
        lockEnd = locked[1].toString();
        if (locked[1] > BigInt(0)) {
          lockEndDate = new Date(Number(locked[1]) * 1000).toLocaleString();
        }
      } else if (typeof locked === "object" && locked.amount !== undefined) {
        const rawAmount = locked.amount < BigInt(0) ? -locked.amount : locked.amount;
        lockedAmount = formatUnits(rawAmount, 18);
        lockEnd = locked.end.toString();
        if (locked.end > BigInt(0)) {
          lockEndDate = new Date(Number(locked.end) * 1000).toLocaleString();
        }
      }
    }

    return {
      address: ve.address,
      name: ve.name,
      nftCount: nftCount !== undefined ? Number(nftCount) : undefined,
      tokenId: tokenId?.toString(),
      lockedAmount,
      lockEnd,
      lockEndDate,
      error: nftCountResult?.error?.message || tokenIdResult?.error?.message,
    };
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

      {/* VE Lock Positions */}
      {veLockInfos.length > 0 && (
        <>
          <h4 className="text-md font-bold mt-6 mb-3 text-pink-400">🔒 Voting Escrow Locks (NFT)</h4>
          <div className="space-y-4">
            {veLockInfos.map((ve, idx) => (
              <div key={idx} className="border border-pink-700 p-3 rounded bg-pink-900/20">
                <p className="text-pink-300 font-bold">{ve.name}</p>
                <p className="text-gray-400 text-xs break-all">{ve.address}</p>
                
                {ve.error ? (
                  <p className="text-red-400">Error: {ve.error}</p>
                ) : (
                  <>
                    <p>
                      <span className="text-gray-400">NFT Count:</span>{" "}
                      <span className="text-cyan-400">{ve.nftCount ?? "0"}</span>
                    </p>
                    {ve.tokenId && (
                      <p>
                        <span className="text-gray-400">Token ID:</span>{" "}
                        <span className="text-yellow-400">{ve.tokenId}</span>
                      </p>
                    )}
                    {ve.lockedAmount && (
                      <p>
                        <span className="text-gray-400">Locked Amount:</span>{" "}
                        <span className="text-green-400">{ve.lockedAmount}</span>{" "}
                        <span className="text-gray-500">BTC</span>
                      </p>
                    )}
                    {ve.lockEndDate && (
                      <p>
                        <span className="text-gray-400">Unlock Date:</span>{" "}
                        <span className="text-orange-400">{ve.lockEndDate}</span>
                      </p>
                    )}
                    {ve.nftCount === 0 && (
                      <p className="text-gray-500 italic">No lock found for this wallet</p>
                    )}
                    {ve.nftCount && ve.nftCount > 0 && !ve.lockedAmount && (
                      <p className="text-yellow-500">Has NFT but waiting for lock data...</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Raw data logged to console for detailed inspection</p>
      </div>
    </div>
  );
}
