import { createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  baseSepolia,
} from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || 'creator-commerce-hub';

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum, base, baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});

