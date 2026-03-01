"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem, zeroAddress } from "viem";
import { MEZO_MAINNET_CONTRACTS, CHAIN_IDS } from "@/config/contracts";
import { VOTING_ESCROW_ABI, VAULT_ABI } from "@/config/abis";
import { useBTCPrice } from "@/lib/price-service";

// ─── Constants ────────────────────────────────────────────────────────────────

const MUSD_PRICE_USD = 1; // stable peg
const MAX_BLOCK_RANGE = BigInt(50_000); // how far back to scan for recent depositors

// ─── Event signatures ─────────────────────────────────────────────────────────

// ERC-721 Transfer – when from == 0x0 it's a mint (new veBTC lock)
const ERC721_TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);

// ERC-4626 Deposit – used by MUSD Vault and sMUSD
const ERC4626_DEPOSIT = parseAbiItem(
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)"
);

// VeBTC rewards claimed from RewardsDistributor
const REWARDS_CLAIMED = parseAbiItem(
  "event Claimed(address indexed to, uint256 tokenId, uint256 amount)"
);

// ─── Mini ABIs ────────────────────────────────────────────────────────────────

const REWARDS_DISTRIBUTOR_ABI = [
  {
    inputs: [{ name: "_tokenId", type: "uint256" }],
    name: "claimable",
    outputs: [{ name: "claimable_", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalValueUSD: number;
  /** Pending + claimed rewards combined */
  totalRewardsUSD: number;
  /** Already claimed / withdrawn rewards (from event logs) */
  claimedRewardsUSD: number;
  /** Still pending / claimable rewards */
  pendingRewardsUSD: number;
  /** Return % based on rewards / deposited value */
  pnlPercentage: number;
  topStrategy: string;
  positionCount: number;
  hasVeBtc: boolean;
  hasVault: boolean;
  hasSavings: boolean;
  /** Locked BTC amount */
  veBtcLocked: number;
  /** Explorer link to the last updated block timestamp (approximated) */
  lastActive: Date;
}

// ─── Internal wallet accumulator ─────────────────────────────────────────────

interface WalletAccum {
  address: string;
  veBtcTokenId?: bigint;
  veBtcLocked: number;
  vaultShares: number;
  savingsShares: number;
  pendingRewardsBTC: number;
  claimedRewardsBTC: number;
}

// ─── Helper: safe multicall chunk ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeMulticallChunk(client: any, calls: any[]): Promise<any[]> {
  if (calls.length === 0) return [];
  try {
    return await client.multicall({ contracts: calls, allowFailure: true });
  } catch {
    return calls.map(() => ({ result: undefined, status: "failure" }));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeaderboard(maxWallets = 75) {
  // Always read from mainnet – leaderboard is mainnet-only
  const publicClient = usePublicClient({ chainId: CHAIN_IDS.MEZO_MAINNET });
  const { price: priceData } = useBTCPrice();
  const btcPrice = priceData?.btc || 104_000;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    if (!publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const contracts = MEZO_MAINNET_CONTRACTS;

      // ── 1. Determine block range ───────────────────────────────────────────
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock =
        currentBlock > MAX_BLOCK_RANGE
          ? currentBlock - MAX_BLOCK_RANGE
          : BigInt(0);

      // ── 2. Collect unique wallet addresses from events ─────────────────────
      const walletSet = new Set<string>();

      // veBTC NFT mints (Transfer from 0x0)
      try {
        const logs = await publicClient.getLogs({
          address: contracts.VeBTC as `0x${string}`,
          event: ERC721_TRANSFER,
          args: { from: zeroAddress },
          fromBlock,
          toBlock: currentBlock,
        });
        logs.forEach((l) => {
          if (l.args.to) walletSet.add(l.args.to.toLowerCase());
        });
      } catch (e) {
        console.warn("[Leaderboard] veBTC transfers:", e);
      }

      // MUSD August Vault deposits
      try {
        const logs = await publicClient.getLogs({
          address: contracts.MUSDVault as `0x${string}`,
          event: ERC4626_DEPOSIT,
          fromBlock,
          toBlock: currentBlock,
        });
        logs.forEach((l) => {
          if (l.args.owner) walletSet.add(l.args.owner.toLowerCase());
        });
      } catch (e) {
        console.warn("[Leaderboard] MUSD Vault deposits:", e);
      }

      // sMUSD savings deposits
      try {
        const logs = await publicClient.getLogs({
          address: contracts.MUSDSavingsRate as `0x${string}`,
          event: ERC4626_DEPOSIT,
          fromBlock,
          toBlock: currentBlock,
        });
        logs.forEach((l) => {
          if (l.args.owner) walletSet.add(l.args.owner.toLowerCase());
        });
      } catch (e) {
        console.warn("[Leaderboard] sMUSD deposits:", e);
      }

      const wallets = Array.from(walletSet).slice(0, maxWallets);

      if (wallets.length === 0) {
        setEntries([]);
        setLastUpdated(new Date());
        return;
      }

      // ── 3. Collect ALL-TIME claimed rewards from VeBTCRewardsDistributor ──
      const claimedByWallet = new Map<string, bigint>();
      try {
        const claimedLogs = await publicClient.getLogs({
          address: contracts.VeBTCRewardsDistributor as `0x${string}`,
          event: REWARDS_CLAIMED,
          fromBlock: BigInt(0), // all-time
          toBlock: currentBlock,
        });
        claimedLogs.forEach((l) => {
          if (l.args.to && l.args.amount) {
            const addr = l.args.to.toLowerCase();
            claimedByWallet.set(
              addr,
              (claimedByWallet.get(addr) ?? BigInt(0)) + l.args.amount
            );
          }
        });
      } catch (e) {
        console.warn("[Leaderboard] Rewards Claimed events:", e);
      }

      // ── 4. Batch-read: NFT count + first token ID + vault shares per wallet ─
      const FIELDS_PER_WALLET = 4;
      const posCallsFlat = wallets.flatMap((addr) => [
        {
          address: contracts.VeBTC as `0x${string}`,
          abi: VOTING_ESCROW_ABI,
          functionName: "balanceOf" as const,
          args: [addr as `0x${string}`],
          chainId: CHAIN_IDS.MEZO_MAINNET,
        },
        {
          address: contracts.VeBTC as `0x${string}`,
          abi: VOTING_ESCROW_ABI,
          functionName: "tokenOfOwnerByIndex" as const,
          args: [addr as `0x${string}`, BigInt(0)],
          chainId: CHAIN_IDS.MEZO_MAINNET,
        },
        {
          address: contracts.MUSDVault as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "balanceOf" as const,
          args: [addr as `0x${string}`],
          chainId: CHAIN_IDS.MEZO_MAINNET,
        },
        {
          address: contracts.MUSDSavingsRate as `0x${string}`,
          abi: VAULT_ABI,
          functionName: "balanceOf" as const,
          args: [addr as `0x${string}`],
          chainId: CHAIN_IDS.MEZO_MAINNET,
        },
      ]);

      // Chunk into groups of 20 calls (5 wallets × 4)
      const CHUNK = 20;
      const posResults: unknown[] = [];
      for (let i = 0; i < posCallsFlat.length; i += CHUNK) {
        const res = await safeMulticallChunk(
          publicClient,
          posCallsFlat.slice(i, i + CHUNK)
        );
        posResults.push(...res);
      }

      // ── 5. Parse first-pass results ──────────────────────────────────────
      const accumMap = new Map<string, WalletAccum>();
      const veBtcHolders: { addr: string; tokenId: bigint; mapIdx: number }[] =
        [];

      wallets.forEach((addr, i) => {
        const base = i * FIELDS_PER_WALLET;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nftCount = (posResults[base] as any)?.result as bigint | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokenId = (posResults[base + 1] as any)?.result as
          | bigint
          | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vaultSharesRaw = (posResults[base + 2] as any)?.result as
          | bigint
          | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savingsSharesRaw = (posResults[base + 3] as any)?.result as
          | bigint
          | undefined;

        const accum: WalletAccum = {
          address: addr,
          veBtcTokenId: tokenId,
          veBtcLocked: 0,
          vaultShares: vaultSharesRaw
            ? parseFloat(formatUnits(vaultSharesRaw, 18))
            : 0,
          savingsShares: savingsSharesRaw
            ? parseFloat(formatUnits(savingsSharesRaw, 18))
            : 0,
          pendingRewardsBTC: 0,
          claimedRewardsBTC: parseFloat(
            formatUnits(claimedByWallet.get(addr) ?? BigInt(0), 18)
          ),
        };

        accumMap.set(addr, accum);

        if (nftCount && nftCount > BigInt(0) && tokenId !== undefined) {
          veBtcHolders.push({ addr, tokenId, mapIdx: i });
        }
      });

      // ── 6. Batch-read locked amounts + pending rewards for veBTC holders ──
      if (veBtcHolders.length > 0) {
        const lockCallsFlat = veBtcHolders.flatMap(({ tokenId }) => [
          {
            address: contracts.VeBTC as `0x${string}`,
            abi: VOTING_ESCROW_ABI,
            functionName: "locked" as const,
            args: [tokenId],
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
          {
            address: contracts.VeBTCRewardsDistributor as `0x${string}`,
            abi: REWARDS_DISTRIBUTOR_ABI,
            functionName: "claimable" as const,
            args: [tokenId],
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
        ]);

        const lockResults: unknown[] = [];
        for (let i = 0; i < lockCallsFlat.length; i += CHUNK) {
          const res = await safeMulticallChunk(
            publicClient,
            lockCallsFlat.slice(i, i + CHUNK)
          );
          lockResults.push(...res);
        }

        veBtcHolders.forEach(({ addr }, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lockedResult = (lockResults[i * 2] as any)?.result;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const claimableRaw = (lockResults[i * 2 + 1] as any)?.result as
            | bigint
            | undefined;

          let lockedAmount = 0;
          if (lockedResult !== undefined && lockedResult !== null) {
            if (Array.isArray(lockedResult) && lockedResult.length >= 1) {
              // Tuple [amount, end] or [amount, end, isPermanent]
              const raw =
                lockedResult[0] < BigInt(0)
                  ? -lockedResult[0]
                  : lockedResult[0];
              lockedAmount = parseFloat(formatUnits(raw, 18));
            } else if (
              typeof lockedResult === "object" &&
              "amount" in lockedResult
            ) {
              const raw =
                lockedResult.amount < BigInt(0)
                  ? -lockedResult.amount
                  : lockedResult.amount;
              lockedAmount = parseFloat(formatUnits(raw, 18));
            }
          }

          const pending = claimableRaw
            ? parseFloat(formatUnits(claimableRaw, 18))
            : 0;

          const accum = accumMap.get(addr);
          if (accum) {
            accum.veBtcLocked = lockedAmount;
            accum.pendingRewardsBTC = pending;
          }
        });
      }

      // ── 7. Read vault ratios once (for USD value of shares) ───────────────
      let vaultRatio = 1;
      let savingsRatio = 1;
      try {
        const ratioResults = await safeMulticallChunk(publicClient, [
          {
            address: contracts.MUSDVault as `0x${string}`,
            abi: VAULT_ABI,
            functionName: "totalAssets" as const,
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
          {
            address: contracts.MUSDVault as `0x${string}`,
            abi: VAULT_ABI,
            functionName: "totalSupply" as const,
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
          {
            address: contracts.MUSDSavingsRate as `0x${string}`,
            abi: VAULT_ABI,
            functionName: "totalAssets" as const,
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
          {
            address: contracts.MUSDSavingsRate as `0x${string}`,
            abi: VAULT_ABI,
            functionName: "totalSupply" as const,
            chainId: CHAIN_IDS.MEZO_MAINNET,
          },
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vTA = (ratioResults[0] as any)?.result as bigint | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vTS = (ratioResults[1] as any)?.result as bigint | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sTA = (ratioResults[2] as any)?.result as bigint | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sTS = (ratioResults[3] as any)?.result as bigint | undefined;

        if (vTA && vTS && vTS > BigInt(0)) {
          vaultRatio =
            parseFloat(formatUnits(vTA, 18)) /
            parseFloat(formatUnits(vTS, 18));
        }
        if (sTA && sTS && sTS > BigInt(0)) {
          savingsRatio =
            parseFloat(formatUnits(sTA, 18)) /
            parseFloat(formatUnits(sTS, 18));
        }
      } catch (e) {
        console.warn("[Leaderboard] Vault ratios:", e);
      }

      // ── 8. Compute final leaderboard entries ─────────────────────────────
      const rawEntries: LeaderboardEntry[] = [];

      accumMap.forEach((w) => {
        const veBtcUSD = w.veBtcLocked * btcPrice;
        const vaultUSD = w.vaultShares * vaultRatio * MUSD_PRICE_USD;
        const savingsUSD = w.savingsShares * savingsRatio * MUSD_PRICE_USD;
        const totalValueUSD = veBtcUSD + vaultUSD + savingsUSD;

        const pendingUSD = w.pendingRewardsBTC * btcPrice;
        const claimedUSD = w.claimedRewardsBTC * btcPrice;
        const totalRewardsUSD = pendingUSD + claimedUSD;

        // Skip wallets with no meaningful activity
        if (totalValueUSD < 0.01 && totalRewardsUSD < 0.01) return;

        const hasVeBtc = w.veBtcLocked > 0;
        const hasVault = w.vaultShares > 0;
        const hasSavings = w.savingsShares > 0;

        let positionCount = 0;
        if (hasVeBtc) positionCount++;
        if (hasVault) positionCount++;
        if (hasSavings) positionCount++;

        // Determine strategy label from active positions
        const topStrategy =
          hasVeBtc && hasVault && hasSavings
            ? "Power User (All Protocols)"
            : hasVeBtc && hasSavings
              ? "veBTC + sMUSD Combo"
              : hasVeBtc && hasVault
                ? "veBTC + MUSD Vault"
                : hasVault && hasSavings
                  ? "MUSD Diversified"
                  : hasVeBtc
                    ? "Pure veBTC Lock"
                    : hasSavings
                      ? "sMUSD Saver"
                      : hasVault
                        ? "MUSD Core Vault"
                        : "Depositor";

        const pnlPercentage =
          totalValueUSD > 0 ? (totalRewardsUSD / totalValueUSD) * 100 : 0;

        rawEntries.push({
          rank: 0, // assigned after sort
          address: w.address,
          totalValueUSD,
          totalRewardsUSD,
          claimedRewardsUSD: claimedUSD,
          pendingRewardsUSD: pendingUSD,
          pnlPercentage,
          topStrategy,
          positionCount,
          hasVeBtc,
          hasVault,
          hasSavings,
          veBtcLocked: w.veBtcLocked,
          lastActive: new Date(),
        });
      });

      // Sort by total rewards descending, assign ranks
      rawEntries.sort((a, b) => b.totalRewardsUSD - a.totalRewardsUSD);
      rawEntries.forEach((e, i) => {
        e.rank = i + 1;
      });

      setEntries(rawEntries);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("[Leaderboard] Fatal error:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load leaderboard")
      );
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, btcPrice, maxWallets]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, isLoading, error, lastUpdated, refetch: fetch };
}
