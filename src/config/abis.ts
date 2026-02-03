// Contract ABIs for reading Mezo positions
// These are minimal ABIs containing only the read functions we need

// Standard ERC20 ABI (for token balances)
export const ERC20_ABI = [
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
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// VotingEscrow ABI (for veBTC and veMEZO)
// Based on Curve's VotingEscrow pattern
export const VOTING_ESCROW_ABI = [
  // Get user's locked balance
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get user's lock details
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "locked",
    outputs: [
      { name: "amount", type: "int128" },
      { name: "end", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Alternative lock structure (some implementations)
  {
    inputs: [{ name: "", type: "address" }],
    name: "locked",
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "end", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get total locked
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get user's token ID (if NFT-based)
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get lock by token ID
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "locked",
    outputs: [
      { name: "amount", type: "int128" },
      { name: "end", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get number of locks owned
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOfNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ownerToNFTokenIdList - get all token IDs for owner
  {
    inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }],
    name: "ownerToNFTokenIdList",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC4626 Vault ABI (for MUSD Vault and Savings)
export const VAULT_ABI = [
  // Get user's shares
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Convert shares to assets
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Convert assets to shares
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "convertToShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get total assets in vault
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get total supply of shares
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get underlying asset
  {
    inputs: [],
    name: "asset",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Get decimals
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  // Preview redeem (how much assets for shares)
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "previewRedeem",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Max withdraw for user
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "maxWithdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// LP Pool ABI (for liquidity positions)
export const LP_POOL_ABI = [
  // Get LP token balance
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get total supply
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get reserves
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
  // Get token0
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Get token1
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Get decimals
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Gauge ABI (for staked LP and rewards)
export const GAUGE_ABI = [
  // Get staked balance
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get earned rewards
  {
    inputs: [{ name: "account", type: "address" }],
    name: "earned",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Get reward rate
  {
    inputs: [],
    name: "rewardRate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
