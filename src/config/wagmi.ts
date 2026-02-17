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
import { createConfig, http, fallback } from "wagmi";
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
  // Mezo Mainnet first for production, then Testnet for testing
  chains: [mezoMainnet, mezoTestnet, mainnet, sepolia],
  transports: {
    // Use fallback RPCs to avoid rate limiting
    [mezoMainnet.id]: fallback([
      http("https://mezo.drpc.org", { 
        batch: { wait: 100 }, // Batch requests with 100ms delay
        retryCount: 3,
        retryDelay: 1000,
      }),
      http("https://rpc-http.mezo.boar.network", {
        batch: { wait: 100 },
        retryCount: 2,
        retryDelay: 2000,
      }),
    ]),
    [mezoTestnet.id]: http("https://rpc.test.mezo.org", {
      batch: { wait: 100 },
      retryCount: 3,
    }),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
