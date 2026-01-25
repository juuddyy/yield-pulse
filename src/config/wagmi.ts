import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

// Define Mezo chain (if not in default chains)
// Note: Update these values based on actual Mezo chain configuration
const mezoMainnet = {
  id: 31337, // Replace with actual Mezo chain ID
  name: "Mezo",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: { http: ["https://rpc.mezo.org"] }, // Replace with actual RPC
    public: { http: ["https://rpc.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
} as const;

export const config = getDefaultConfig({
  appName: "Yield Pulse",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [mainnet, mezoMainnet, sepolia],
  ssr: true,
});

export { mezoMainnet };
