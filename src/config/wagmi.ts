import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
  okxWallet,
  injectedWallet,
  rainbowWallet,
  trustWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

// Mezo Mainnet Configuration (from official docs)
export const mezoMainnet = {
  id: 31612, // Mezo Mainnet chain ID
  name: "Mezo",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: { http: ["https://rpc-http.mezo.boar.network"] },
    public: { http: ["https://mezo.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
} as const;

// Mezo Testnet Configuration
export const mezoTestnet = {
  id: 31611, // Mezo Testnet chain ID
  name: "Mezo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: { http: ["https://rpc.test.mezo.org"] },
    public: { http: ["https://rpc.test.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Testnet Explorer", url: "https://explorer.test.mezo.org" },
  },
  testnet: true,
} as const;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

// Configure wallet groups
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rabbyWallet,
        okxWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: "Other Wallets",
      wallets: [
        walletConnectWallet,
        rainbowWallet,
        trustWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "Yield Pulse",
    projectId,
  }
);

export const config = createConfig({
  connectors,
  // Mezo Testnet first for testing, then Mainnet for production
  chains: [mezoTestnet, mezoMainnet, mainnet, sepolia],
  transports: {
    [mezoTestnet.id]: http("https://rpc.test.mezo.org"),
    [mezoMainnet.id]: http("https://rpc-http.mezo.boar.network"),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
