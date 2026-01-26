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

// Define Mezo chain
// Note: Update these values based on actual Mezo chain configuration
export const mezoMainnet = {
  id: 31611, // Mezo Mainnet chain ID
  name: "Mezo",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: { http: ["https://rpc.mezo.org"] },
    public: { http: ["https://rpc.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
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
  chains: [mainnet, mezoMainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [mezoMainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
