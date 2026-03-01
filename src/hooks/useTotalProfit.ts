/**
 * useTotalProfit.ts
 *
 * Computes a connected wallet's TOTAL LIFETIME PROFIT across all Mezo protocols:
 *
 *   veBTC rewards (claimed + pending)
 * + MUSD Vault yield  ((withdrawn + current_value) − deposited)
 * + sMUSD savings yield ((withdrawn + current_value) − deposited)
 * + LP Gauge rewards (claimed events + pending claimable)
 *
 * This includes rewards that have ALREADY been taken out of Mezo, because
 * we sum all historical Deposit and Withdraw events (all-time, from block 0).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { formatUnits, parseAbiItem, zeroAddress } from "viem";
import { getContracts, CHAIN_IDS } from "@/config/contracts";
import { VOTING_ESCROW_ABI, VAULT_ABI } from "@/config/abis";
import { useBTCPrice } from "@/lib/price-service";

// ─── Constants ────────────────────────────────────────────────────────────────

const MUSD_USD = 1; // stable peg

// ─── Event signatures ─────────────────────────────────────────────────────────

/** ERC-4626 Deposit – emitted when assets are deposited into a vault */
const ERC4626_DEPOSIT = parseAbiItem(
    "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)"
);

/** ERC-4626 Withdraw – emitted when assets leave a vault (partial or full exit) */
const ERC4626_WITHDRAW = parseAbiItem(
    "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
);

/** VeBTCRewardsDistributor – BTC rewards claimed by wallet address */
const VEBTC_CLAIMED = parseAbiItem(
    "event Claimed(address indexed to, uint256 tokenId, uint256 amount)"
);

/** Gauge/savings vault rewards claimed – Velodrome-style ClaimRewards event */
const GAUGE_CLAIM_REWARDS = parseAbiItem(
    "event ClaimRewards(address indexed from, uint256 amount)"
);

/** Voting reward contracts (FeesVotingReward / BribeVotingReward) – 3-parameter version */
const VOTING_REWARD_CLAIM = parseAbiItem(
    "event ClaimRewards(address indexed from, address indexed reward, uint256 amount)"
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

const GAUGE_ABI_MINI = [
    {
        inputs: [{ name: "account", type: "address" }],
        name: "earned",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

const VOTER_ABI_MINI = [
    {
        inputs: [{ name: "pool", type: "address" }],
        name: "gauges",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "_gauge", type: "address" }],
        name: "gaugeToFees",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "_gauge", type: "address" }],
        name: "gaugeToBribe",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TotalProfitBreakdown {
    /** Grand total profit in USD — the headline number */
    totalProfitUSD: number;

    // ── veBTC rewards ──
    /** BTC pending (not yet claimed) × BTC price */
    veBtcPendingUSD: number;
    /** BTC claimed (already withdrawn from distributor, may be long gone) × BTC price */
    veBtcClaimedUSD: number;
    /** Combined veBTC reward USD */
    veBtcTotalRewardsUSD: number;

    // ── MUSD August Vault ──
    /** (assets_withdrawn + current_value_in_vault) − assets_deposited */
    vaultProfitUSD: number;
    vaultDeposited: number;
    vaultWithdrawn: number;
    vaultCurrentValue: number;

    // ── sMUSD Savings ──
    savingsProfitUSD: number;
    savingsDeposited: number;
    savingsWithdrawn: number;
    savingsCurrentValue: number;
    /** Pending claimable MUSD from sMUSD gauge rewards (earned but not claimed) */
    savingsEarnedUSD: number;
    /** Previously claimed MUSD gauge rewards from sMUSD vault */
    savingsClaimedUSD: number;

    // ── LP Gauge rewards ──
    gaugePendingUSD: number;
    gaugeClaimedUSD: number;
    gaugeTotalUSD: number;

    // ── Voting rewards (from voting with veBTC on gauges) ──
    /** MUSD/BTC claimed from FeesVotingReward + BribeVotingReward contracts */
    votingRewardClaimedUSD: number;

    isLoading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
}

const INITIAL: TotalProfitBreakdown = {
    totalProfitUSD: 0,
    veBtcPendingUSD: 0,
    veBtcClaimedUSD: 0,
    veBtcTotalRewardsUSD: 0,
    vaultProfitUSD: 0,
    vaultDeposited: 0,
    vaultWithdrawn: 0,
    vaultCurrentValue: 0,
    savingsProfitUSD: 0,
    savingsDeposited: 0,
    savingsWithdrawn: 0,
    savingsCurrentValue: 0,
    savingsEarnedUSD: 0,
    savingsClaimedUSD: 0,
    gaugePendingUSD: 0,
    gaugeClaimedUSD: 0,
    gaugeTotalUSD: 0,
    votingRewardClaimedUSD: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeGetLogs(client: any, params: any): Promise<any[]> {
    try {
        return await client.getLogs(params);
    } catch (e) {
        console.warn("[useTotalProfit] getLogs failed:", params.address, e);
        return [];
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeReadContract(client: any, params: any): Promise<any> {
    try {
        return await client.readContract(params);
    } catch (e) {
        return undefined;
    }
}

// Sum a list of bigint logs by a numeric field
function sumLogs(logs: { args?: Record<string, bigint | string | unknown> }[], field: string): bigint {
    return logs.reduce((acc, log) => {
        const val = (log.args as Record<string, unknown>)?.[field];
        if (typeof val === "bigint") return acc + val;
        return acc;
    }, BigInt(0));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTotalProfit(): TotalProfitBreakdown {
    const { address, isConnected, chainId } = useAccount();
    const targetChainId = chainId || CHAIN_IDS.MEZO_MAINNET;
    const publicClient = usePublicClient({ chainId: targetChainId });
    const { price: priceData } = useBTCPrice();
    const btcPrice = priceData?.btc || 104_000;

    const [data, setData] = useState<TotalProfitBreakdown>(INITIAL);

    const compute = useCallback(async () => {
        if (!publicClient || !isConnected || !address) {
            setData({ ...INITIAL });
            return;
        }

        setData((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const c = getContracts(targetChainId);
            const user = address.toLowerCase() as `0x${string}`;

            // ── Parallel: fetch all event logs for the connected wallet from block 0 ──
            const [
                vaultDepositLogs,
                vaultWithdrawLogs,
                savingsDepositLogs,
                savingsWithdrawLogs,
                veBtcClaimedLogs,
                musdbBtcGaugeLogs,
                musdUsdcGaugeLogs,
                savingsClaimedLogs,
            ] = await Promise.all([
                // MUSD Vault deposits (where owner == user)
                safeGetLogs(publicClient, {
                    address: c.MUSDVault as `0x${string}`,
                    event: ERC4626_DEPOSIT,
                    args: { owner: user },
                    fromBlock: BigInt(0),
                }),
                // MUSD Vault withdrawals (where owner == user)
                safeGetLogs(publicClient, {
                    address: c.MUSDVault as `0x${string}`,
                    event: ERC4626_WITHDRAW,
                    args: { owner: user },
                    fromBlock: BigInt(0),
                }),
                // sMUSD deposits
                safeGetLogs(publicClient, {
                    address: c.MUSDSavingsRate as `0x${string}`,
                    event: ERC4626_DEPOSIT,
                    args: { owner: user },
                    fromBlock: BigInt(0),
                }),
                // sMUSD withdrawals
                safeGetLogs(publicClient, {
                    address: c.MUSDSavingsRate as `0x${string}`,
                    event: ERC4626_WITHDRAW,
                    args: { owner: user },
                    fromBlock: BigInt(0),
                }),
                // veBTC rewards claimed by this wallet (all token IDs)
                safeGetLogs(publicClient, {
                    address: c.VeBTCRewardsDistributor as `0x${string}`,
                    event: VEBTC_CLAIMED,
                    args: { to: user },
                    fromBlock: BigInt(0),
                }),
                // LP Gauge claimed rewards (MUSD/BTC pool) — ClaimRewards event
                safeGetLogs(publicClient, {
                    address: c.MUSD_BTC_Gauge as `0x${string}`,
                    event: GAUGE_CLAIM_REWARDS,
                    args: { from: user },
                    fromBlock: BigInt(0),
                }),
                // LP Gauge claimed rewards (MUSD/USDC pool) — ClaimRewards event
                safeGetLogs(publicClient, {
                    address: c.MUSD_USDC_Gauge as `0x${string}`,
                    event: GAUGE_CLAIM_REWARDS,
                    args: { from: user },
                    fromBlock: BigInt(0),
                }),
                // sMUSD savings vault: gauge-style claimed rewards (ClaimRewards event)
                safeGetLogs(publicClient, {
                    address: c.MUSDSavingsRate as `0x${string}`,
                    event: GAUGE_CLAIM_REWARDS,
                    args: { from: user },
                    fromBlock: BigInt(0),
                }),
            ]);

            // ── veBTC: total claimed rewards (already out of Mezo) ─────────────────
            const claimedBTCRaw = sumLogs(veBtcClaimedLogs, "amount");
            const veBtcClaimedBTC = parseFloat(formatUnits(claimedBTCRaw, 18));

            // ── veBTC: get user's token IDs and pending claimable ─────────────────
            let veBtcPendingBTC = 0;
            try {
                const nftCount = await safeReadContract(publicClient, {
                    address: c.VeBTC as `0x${string}`,
                    abi: VOTING_ESCROW_ABI,
                    functionName: "balanceOf",
                    args: [user],
                });

                if (nftCount && nftCount > BigInt(0)) {
                    // Read all token IDs owned by this user
                    const tokenIdPromises = Array.from({ length: Number(nftCount) }, (_, i) =>
                        safeReadContract(publicClient, {
                            address: c.VeBTC as `0x${string}`,
                            abi: VOTING_ESCROW_ABI,
                            functionName: "tokenOfOwnerByIndex",
                            args: [user, BigInt(i)],
                        })
                    );
                    const tokenIds = await Promise.all(tokenIdPromises);

                    // Read claimable for each token ID
                    const claimablePromises = tokenIds
                        .filter((id): id is bigint => id !== undefined && id !== null)
                        .map((tokenId) =>
                            safeReadContract(publicClient, {
                                address: c.VeBTCRewardsDistributor as `0x${string}`,
                                abi: REWARDS_DISTRIBUTOR_ABI,
                                functionName: "claimable",
                                args: [tokenId],
                            })
                        );
                    const claimables = await Promise.all(claimablePromises);

                    veBtcPendingBTC = claimables
                        .filter((v): v is bigint => typeof v === "bigint")
                        .reduce((sum, v) => sum + parseFloat(formatUnits(v, 18)), 0);
                }
            } catch (e) {
                console.warn("[useTotalProfit] veBTC pending:", e);
            }

            const veBtcClaimedUSD = veBtcClaimedBTC * btcPrice;
            const veBtcPendingUSD = veBtcPendingBTC * btcPrice;
            const veBtcTotalRewardsUSD = veBtcClaimedUSD + veBtcPendingUSD;

            // ── MUSD Vault vault profit = (withdrawn + current) − deposited ────────
            const vaultDepositedRaw = sumLogs(vaultDepositLogs, "assets");
            const vaultWithdrawnRaw = sumLogs(vaultWithdrawLogs, "assets");
            const vaultDeposited = parseFloat(formatUnits(vaultDepositedRaw, 18)) * MUSD_USD;
            const vaultWithdrawn = parseFloat(formatUnits(vaultWithdrawnRaw, 18)) * MUSD_USD;

            // Current vault value via shares × ratio
            let vaultCurrentValue = 0;
            try {
                const [sharesRaw, totalAssetsRaw, totalSupplyRaw] = await Promise.all([
                    safeReadContract(publicClient, {
                        address: c.MUSDVault as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "balanceOf",
                        args: [user],
                    }),
                    safeReadContract(publicClient, {
                        address: c.MUSDVault as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "totalAssets",
                    }),
                    safeReadContract(publicClient, {
                        address: c.MUSDVault as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "totalSupply",
                    }),
                ]);
                if (sharesRaw && totalAssetsRaw && totalSupplyRaw && totalSupplyRaw > BigInt(0)) {
                    const ratio =
                        parseFloat(formatUnits(totalAssetsRaw, 18)) /
                        parseFloat(formatUnits(totalSupplyRaw, 18));
                    vaultCurrentValue = parseFloat(formatUnits(sharesRaw, 18)) * ratio * MUSD_USD;
                }
            } catch (e) {
                console.warn("[useTotalProfit] vault current value:", e);
            }

            const vaultProfitUSD = vaultWithdrawn + vaultCurrentValue - vaultDeposited;

            // ── sMUSD savings profit ───────────────────────────────────────────────
            const savingsDepositedRaw = sumLogs(savingsDepositLogs, "assets");
            const savingsWithdrawnRaw = sumLogs(savingsWithdrawLogs, "assets");
            const savingsDeposited = parseFloat(formatUnits(savingsDepositedRaw, 18)) * MUSD_USD;
            const savingsWithdrawn = parseFloat(formatUnits(savingsWithdrawnRaw, 18)) * MUSD_USD;

            let savingsCurrentValue = 0;
            try {
                const [sharesRaw, totalAssetsRaw, totalSupplyRaw] = await Promise.all([
                    safeReadContract(publicClient, {
                        address: c.MUSDSavingsRate as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "balanceOf",
                        args: [user],
                    }),
                    safeReadContract(publicClient, {
                        address: c.MUSDSavingsRate as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "totalAssets",
                    }),
                    safeReadContract(publicClient, {
                        address: c.MUSDSavingsRate as `0x${string}`,
                        abi: VAULT_ABI,
                        functionName: "totalSupply",
                    }),
                ]);
                if (sharesRaw && totalAssetsRaw && totalSupplyRaw && totalSupplyRaw > BigInt(0)) {
                    const ratio =
                        parseFloat(formatUnits(totalAssetsRaw, 18)) /
                        parseFloat(formatUnits(totalSupplyRaw, 18));
                    savingsCurrentValue = parseFloat(formatUnits(sharesRaw, 18)) * ratio * MUSD_USD;
                }
            } catch (e) {
                console.warn("[useTotalProfit] savings current value:", e);
            }

            // savingsProfitUSD computed after LP gauge section (needs savingsEarnedUSD/ClaimedUSD)
            const savingsShareProfitUSD = savingsWithdrawn + savingsCurrentValue - savingsDeposited;

            // ── LP Gauge rewards ───────────────────────────────────────────────────
            // Claimed from ClaimRewards events (field is "amount" in Velodrome style)
            const musdBtcGaugeClaimed = parseFloat(
                formatUnits(sumLogs(musdbBtcGaugeLogs, "amount"), 18)
            );
            const musdUsdcGaugeClaimed = parseFloat(
                formatUnits(sumLogs(musdUsdcGaugeLogs, "amount"), 18)
            );
            // Pending gauge rewards + sMUSD savings earned (all via earned(address))
            const [musdBtcPendingRaw, musdUsdcPendingRaw, savingsEarnedRaw] = await Promise.all([
                safeReadContract(publicClient, {
                    address: c.MUSD_BTC_Gauge as `0x${string}`,
                    abi: GAUGE_ABI_MINI,
                    functionName: "earned",
                    args: [user],
                }),
                safeReadContract(publicClient, {
                    address: c.MUSD_USDC_Gauge as `0x${string}`,
                    abi: GAUGE_ABI_MINI,
                    functionName: "earned",
                    args: [user],
                }),
                // sMUSD savings vault pending claimable rewards
                safeReadContract(publicClient, {
                    address: c.MUSDSavingsRate as `0x${string}`,
                    abi: GAUGE_ABI_MINI,
                    functionName: "earned",
                    args: [user],
                }),
            ]);

            // LP gauge rewards in MUSD — $1 each
            const gaugePendingUSD =
                (musdBtcPendingRaw ? parseFloat(formatUnits(musdBtcPendingRaw, 18)) : 0) +
                (musdUsdcPendingRaw ? parseFloat(formatUnits(musdUsdcPendingRaw, 18)) : 0);
            const gaugeClaimedUSD = (musdBtcGaugeClaimed + musdUsdcGaugeClaimed) * MUSD_USD;
            const gaugeTotalUSD = gaugePendingUSD + gaugeClaimedUSD;

            // sMUSD savings vault gauge rewards (separate from share appreciation)
            const savingsEarnedUSD = savingsEarnedRaw
                ? parseFloat(formatUnits(savingsEarnedRaw, 18)) * MUSD_USD
                : 0;
            const savingsClaimedUSD =
                parseFloat(formatUnits(sumLogs(savingsClaimedLogs, "amount"), 18)) * MUSD_USD;

            // Total savings profit = gauge rewards (earned + claimed) + any share appreciation
            const savingsProfitUSD = savingsEarnedUSD + savingsClaimedUSD + Math.max(0, savingsShareProfitUSD);

            // ── Voting rewards (from voting with veBTC) ────────────────────────────
            // When a user votes with veBTC, they earn fees and bribes from
            // FeesVotingReward and BribeVotingReward contracts per pool.
            // These are accessed via Voter.gaugeToFees(gauge) and Voter.gaugeToBribe(gauge).
            let votingRewardClaimedUSD = 0;
            try {
                const ZERO = "0x0000000000000000000000000000000000000000";
                const pools = [
                    c.MUSD_BTC_Pool,
                    c.MUSD_USDC_Pool,
                    c.MUSD_USDT_Pool,
                    c.cbBTC_BTC_Pool,
                ].filter(p => p !== ZERO) as `0x${string}`[];

                if (pools.length > 0 && (c.Voter as string) !== ZERO) {
                    // Step 1: Resolve gauge address for each pool
                    const gaugeAddrs = await Promise.all(
                        pools.map(pool =>
                            safeReadContract(publicClient, {
                                address: c.Voter as `0x${string}`,
                                abi: VOTER_ABI_MINI,
                                functionName: "gauges",
                                args: [pool],
                            })
                        )
                    );

                    const validGauges = gaugeAddrs.filter(
                        (g): g is `0x${string}` => g != null && g !== ZERO
                    );

                    if (validGauges.length > 0) {
                        // Step 2: Get voting reward contract addresses (fees + bribes)
                        const votingRewardAddrs = await Promise.all(
                            validGauges.flatMap(gauge => [
                                safeReadContract(publicClient, {
                                    address: c.Voter as `0x${string}`,
                                    abi: VOTER_ABI_MINI,
                                    functionName: "gaugeToFees",
                                    args: [gauge],
                                }),
                                safeReadContract(publicClient, {
                                    address: c.Voter as `0x${string}`,
                                    abi: VOTER_ABI_MINI,
                                    functionName: "gaugeToBribe",
                                    args: [gauge],
                                }),
                            ])
                        );

                        // Deduplicate and filter zero addresses
                        const validVotingContracts = Array.from(
                            new Set(
                                votingRewardAddrs.filter(
                                    (a): a is `0x${string}` => a != null && a !== ZERO
                                )
                            )
                        );

                        if (validVotingContracts.length > 0) {
                            // Step 3: Scan ClaimRewards(from, reward, amount) events
                            const votingLogs = await Promise.all(
                                validVotingContracts.map(contractAddr =>
                                    safeGetLogs(publicClient, {
                                        address: contractAddr,
                                        event: VOTING_REWARD_CLAIM,
                                        args: { from: user },
                                        fromBlock: BigInt(0),
                                    })
                                )
                            );

                            // Convert each log's amount to USD using reward token
                            for (const logs of votingLogs) {
                                for (const log of logs) {
                                    const args = log.args as {
                                        from?: string;
                                        reward?: string;
                                        amount?: bigint;
                                    };
                                    if (!args.amount) continue;
                                    const rewardToken = args.reward?.toLowerCase();
                                    let usdValue: number;
                                    if (rewardToken === c.BTC.toLowerCase()) {
                                        usdValue = parseFloat(formatUnits(args.amount, 18)) * btcPrice;
                                    } else {
                                        // MUSD or other stablecoin
                                        usdValue = parseFloat(formatUnits(args.amount, 18)) * MUSD_USD;
                                    }
                                    votingRewardClaimedUSD += usdValue;
                                }
                            }
                            console.log("[useTotalProfit] voting reward contracts found:", validVotingContracts.length, "total claimed USD:", votingRewardClaimedUSD);
                        }
                    }
                }
            } catch (e) {
                console.warn("[useTotalProfit] voting rewards scan failed:", e);
            }

            // ── Grand total ────────────────────────────────────────────────────────
            const totalProfitUSD =
                veBtcTotalRewardsUSD +
                Math.max(0, vaultProfitUSD) +
                savingsProfitUSD +   // already has Math.max applied inside
                gaugeTotalUSD +
                votingRewardClaimedUSD;

            setData({
                totalProfitUSD,
                veBtcPendingUSD,
                veBtcClaimedUSD,
                veBtcTotalRewardsUSD,
                vaultProfitUSD,
                vaultDeposited,
                vaultWithdrawn,
                vaultCurrentValue,
                savingsProfitUSD,
                savingsDeposited,
                savingsWithdrawn,
                savingsCurrentValue,
                savingsEarnedUSD,
                savingsClaimedUSD,
                gaugePendingUSD,
                gaugeClaimedUSD,
                gaugeTotalUSD,
                votingRewardClaimedUSD,
                isLoading: false,
                error: null,
                lastUpdated: new Date(),
            });
        } catch (err) {
            console.error("[useTotalProfit] Fatal error:", err);
            setData((prev) => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err : new Error("Failed to compute profit"),
            }));
        }
    }, [publicClient, address, isConnected, targetChainId, btcPrice]);

    useEffect(() => {
        compute();
    }, [compute]);

    return data;
}
