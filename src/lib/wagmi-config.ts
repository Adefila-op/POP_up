import { createConfig, http } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "@wagmi/connectors";

const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || "creator-commerce-hub";

// Use reliable RPC endpoints
const RPC_URLS = {
  mainnet: process.env.VITE_MAINNET_RPC || "https://eth.llamarpc.com",
  polygon: process.env.VITE_POLYGON_RPC || "https://polygon.llamarpc.com",
  optimism: process.env.VITE_OPTIMISM_RPC || "https://optimism.llamarpc.com",
  arbitrum: process.env.VITE_ARBITRUM_RPC || "https://arbitrum.llamarpc.com",
  base: process.env.VITE_BASE_RPC || "https://base.llamarpc.com",
  baseSepolia: process.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
};

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum, base, baseSepolia],
  connectors: [injected(), walletConnect({ projectId })],
  transports: {
    [mainnet.id]: http(RPC_URLS.mainnet),
    [polygon.id]: http(RPC_URLS.polygon),
    [optimism.id]: http(RPC_URLS.optimism),
    [arbitrum.id]: http(RPC_URLS.arbitrum),
    [base.id]: http(RPC_URLS.base),
    [baseSepolia.id]: http(RPC_URLS.baseSepolia),
  },
});
