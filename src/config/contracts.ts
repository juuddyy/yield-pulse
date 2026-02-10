// Mezo Testnet Contract Addresses
// Extracted from user transactions on explorer.test.mezo.org

export const MEZO_TESTNET_CONTRACTS = {
  // Core Tokens
  BTC: "0x7b7C000000000000000000000000000000000000" as const,
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as const,

  // Voting Escrow (Lock) Contracts
  VeBTC: "0x38E35d92E6Bfc6787272A62345856B13eA12130a" as const,
  VeMEZO: "0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b" as const,
  Voter: "0x263F1Fd5fB7F866881e1B6cD7d5d6c40Fd985F0D" as const,
  BoostVoter: "0x21d7bDF5a5929AD179F8cA0c9014A0B62ae6Bfd1" as const,

  // Vaults & Savings
  MUSDVault: "0x44c8665fe06425Ca801f38DE39e71f61185E90AE" as const,
  MUSDSavingsRate: "0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16" as const,

  // DEX / Liquidity
  Router: "0xD245BeC6836D85e159763a5D2BFcE7CBC3488e03" as const,
  CLSwapRouter: "0x3112908bB72ce9c26a321Eeb22EC8e051F3b6E6a" as const,

  // System Contracts
  BTCCaller: "0x7b7C000000000000000000000000000000000000" as const,
  MEZOCaller: "0x7B7c000000000000000000000000000000000001" as const,
} as const;

// Mezo Mainnet Contract Addresses
// Extracted from official mezo-org/tigris GitHub repository
export const MEZO_MAINNET_CONTRACTS = {
  // Core Tokens
  BTC: "0x7b7C000000000000000000000000000000000000" as const,
  MUSD: "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186" as const,

  // Voting Escrow (Lock) Contracts - from mezo-org/tigris deployments/mainnet
  VeBTC: "0x7D807e9CE1ef73048FEe9A4214e75e894ea25914" as const,
  VeMEZO: "0x0000000000000000000000000000000000000000" as const, // Not deployed yet on mainnet
  Voter: "0x3A4a6919F70e5b0aA32401747C471eCfe2322C1b" as const, // VeBTCVoter
  BoostVoter: "0x0000000000000000000000000000000000000000" as const, // Not deployed yet

  // Vaults & Savings - TODO: Need to find mainnet addresses
  MUSDVault: "0x0000000000000000000000000000000000000000" as const,
  MUSDSavingsRate: "0x0000000000000000000000000000000000000000" as const,

  // DEX / Liquidity - from mezo-org/tigris deployments/mainnet
  Router: "0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706" as const,
  CLSwapRouter: "0x0000000000000000000000000000000000000000" as const,

  // Pools (from docs)
  PoolFactory: "0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248" as const,
  MUSD_BTC_Pool: "0x52e604c44417233b6CcEDDDc0d640A405Caacefb" as const,
  MUSD_USDC_Pool: "0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356" as const,
  MUSD_USDT_Pool: "0x10906a9E9215939561597b4C8e4b98F93c02031A" as const,
  cbBTC_BTC_Pool: "0x72E6b3F126cF4F6C90C08114aC29038A0E269210" as const,

  // Bridged Tokens
  mcbBTC: "0x6a7CD8E1384d49f502b4A4CE9aC9eb320835c5d7" as const,
  mUSDC: "0x04671C72Aab5AC02A03c1098314b1BB6B560c197" as const,
  mUSDT: "0xeB5a5d39dE4Ea42C2Aa6A57EcA2894376683bB8E" as const,

  // System Contracts
  BTCCaller: "0x7b7C000000000000000000000000000000000000" as const,
  MEZOCaller: "0x7B7c000000000000000000000000000000000001" as const,
} as const;

// Chain IDs
export const CHAIN_IDS = {
  MEZO_MAINNET: 31612,
  MEZO_TESTNET: 31611,
} as const;

// Explorer URLs
export const EXPLORER_URLS = {
  [CHAIN_IDS.MEZO_MAINNET]: "https://explorer.mezo.org",
  [CHAIN_IDS.MEZO_TESTNET]: "https://explorer.test.mezo.org",
} as const;

// Get contracts based on chain ID
export function getContracts(chainId: number | undefined) {
  if (chainId === CHAIN_IDS.MEZO_TESTNET) {
    return MEZO_TESTNET_CONTRACTS;
  }
  return MEZO_MAINNET_CONTRACTS;
}

// Get explorer URL based on chain ID
export function getExplorerUrl(chainId: number | undefined): string {
  if (chainId === CHAIN_IDS.MEZO_TESTNET) {
    return EXPLORER_URLS[CHAIN_IDS.MEZO_TESTNET];
  }
  return EXPLORER_URLS[CHAIN_IDS.MEZO_MAINNET];
}

// Get address explorer link
export function getAddressUrl(chainId: number | undefined, address: string): string {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}

// Get transaction explorer link
export function getTxUrl(chainId: number | undefined, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

// Check if a contract address is valid (not zero address)
export function isValidContract(address: string): boolean {
  return address !== "0x0000000000000000000000000000000000000000";
}
