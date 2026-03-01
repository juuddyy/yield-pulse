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
import { MEZO_MAINNET_CONTRACTS, CHAIN_IDS } from "@/config/contracts";
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

/** Gauge reward paid – for LP pool rewards (Velodrome-style) */
const GAUGE_REWARD_PAID = parseAbiItem(
    "event RewardPaid(address indexed user, uint256 reward)"
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

    // ── LP Gauge rewards ──
    gaugePendingUSD: number;
    gaugeClaimedUSD: number;
    gaugeTotalUSD: number;

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
    gaugePendingUSD: 0,
    gaugeClaimedUSD: 0,
    gaugeTotalUSD: 0,
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
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient({ chainId: CHAIN_IDS.MEZO_MAINNET });
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
            const c = MEZO_MAINNET_CONTRACTS;
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
                // LP Gauge rewards (MUSD/BTC pool)
                safeGetLogs(publicClient, {
                    address: c.MUSD_BTC_Gauge as `0x${string}`,
                    event: GAUGE_REWARD_PAID,
                    args: { user },
                    fromBlock: BigInt(0),
                }),
                // LP Gauge rewards (MUSD/USDC pool)
                safeGetLogs(publicClient, {
                    address: c.MUSD_USDC_Gauge as `0x${string}`,
                    event: GAUGE_REWARD_PAID,
                    args: { user },
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

            const savingsProfitUSD = savingsWithdrawn + savingsCurrentValue - savingsDeposited;

            // ── LP Gauge rewards ───────────────────────────────────────────────────
            // Claimed from events (already out of Mezo)
            const musdBtcGaugeClaimed = parseFloat(
                formatUnits(sumLogs(musdbBtcGaugeLogs, "reward"), 18)
            );
            const musdUsdcGaugeClaimed = parseFloat(
                formatUnits(sumLogs(musdUsdcGaugeLogs, "reward"), 18)
            );
            // Pending gauge rewards (earned but not yet claimed)
            const [musdBtcPendingRaw, musdUsdcPendingRaw] = await Promise.all([
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
            ]);

            // Gauge rewards are paid in MUSD (stablecoin) — $1 each
            const gaugePendingUSD =
                (musdBtcPendingRaw ? parseFloat(formatUnits(musdBtcPendingRaw, 18)) : 0) +
                (musdUsdcPendingRaw ? parseFloat(formatUnits(musdUsdcPendingRaw, 18)) : 0);
            const gaugeClaimedUSD = (musdBtcGaugeClaimed + musdUsdcGaugeClaimed) * MUSD_USD;
            const gaugeTotalUSD = gaugePendingUSD + gaugeClaimedUSD;

            // ── Grand total ────────────────────────────────────────────────────────
            const totalProfitUSD =
                veBtcTotalRewardsUSD +
                Math.max(0, vaultProfitUSD) +      // Only count positive yield (negative = unrealised loss, shown elsewhere)
                Math.max(0, savingsProfitUSD) +
                gaugeTotalUSD;

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
                gaugePendingUSD,
                gaugeClaimedUSD,
                gaugeTotalUSD,
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
    }, [publicClient, address, isConnected, btcPrice]);

    useEffect(() => {
        compute();
    }, [compute]);

    return data;
}
