/**
 * Blockchain Integration Module
 * Handles Web3 interactions for IP trading, creator registry, and on-chain transaction recording
 */

import { ethers } from "ethers";

// Contract ABIs (will be imported from artifacts after compilation)
export interface BlockchainConfig {
  network: "sepolia" | "base" | "baseSepolia";
  rpcUrl: string;
  chainId: number;
  creatorRegistryAddress: string;
  ipMarketplaceAddress: string;
}

// Network configuration
const getNetworkConfig = (): Record<string, BlockchainConfig> => {
  const creatorRegistry = import.meta.env.VITE_CREATOR_REGISTRY_ADDRESS || "";
  const ipMarketplace = import.meta.env.VITE_IP_MARKETPLACE_ADDRESS || "";

  return {
    baseSepolia: {
      network: "baseSepolia",
      rpcUrl: "https://sepolia.base.org",
      chainId: 84532,
      creatorRegistryAddress: creatorRegistry,
      ipMarketplaceAddress: ipMarketplace,
    },
    sepolia: {
      network: "sepolia",
      rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
      chainId: 11155111,
      creatorRegistryAddress: creatorRegistry,
      ipMarketplaceAddress: ipMarketplace,
    },
    base: {
      network: "base",
      rpcUrl: "https://base.infura.io/v3/YOUR_KEY",
      chainId: 8453,
      creatorRegistryAddress: creatorRegistry,
      ipMarketplaceAddress: ipMarketplace,
    },
  };
};

export const NETWORKS = getNetworkConfig();

interface EthereumProvider {
  isMetaMask?: boolean;
  isZerion?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  isFramework?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

/**
 * Detect available Web3 wallets
 */
export function getAvailableWallets(): string[] {
  const wallets: string[] = [];

  if (window.ethereum) {
    // Detect wallet provider name
    if (window.ethereum.isMetaMask) {
      wallets.push("MetaMask");
    }
    if (window.ethereum.isZerion) {
      wallets.push("Zerion");
    }
    if (window.ethereum.isCoinbaseWallet) {
      wallets.push("Coinbase Wallet");
    }
    if (window.ethereum.isWalletConnect) {
      wallets.push("WalletConnect");
    }
    if (window.ethereum.isFramework) {
      wallets.push("Frame");
    }
    // Generic provider detected
    if (wallets.length === 0) {
      wallets.push("Web3 Wallet");
    }
  }

  return wallets;
}

/**
 * Check if any wallet is installed
 */
export function isWalletInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/**
 * Get Web3 provider (MetaMask or fallback to RPC)
 */
export function getProvider(
  network: string = "baseSepolia",
): ethers.BrowserProvider | ethers.JsonRpcProvider {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  const config = NETWORKS[network];
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

/**
 * Get signer from any available Web3 wallet (MetaMask, Zerion, WalletConnect, Coinbase Wallet, etc.)
 */
export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (!window.ethereum) {
    throw new Error(
      "No Web3 wallet detected. Please install MetaMask, Zerion, Coinbase Wallet, or another EIP-1193 compatible wallet.",
    );
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

/**
 * Request wallet connection and get user address (supports MetaMask, Zerion, WalletConnect, etc.)
 */
export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    const walletLinks = [
      "MetaMask: https://metamask.io",
      "Zerion: https://zerion.io",
      "Coinbase Wallet: https://www.coinbase.com/wallet",
      "WalletConnect: https://walletconnect.com",
    ];
    throw new Error(
      `No Web3 wallet detected. Please install one of these:\n${walletLinks.join("\n")}`,
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  return accounts[0];
}

/**
 * Get user's balance on selected network
 */
export async function getBalance(
  address: string,
  network: string = "baseSepolia",
): Promise<string> {
  const provider = getProvider(network);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

/**
 * Mint creator NFT on-chain
 */
export async function mintCreatorNFT(
  creatorAddress: string,
  username: string,
  bio: string,
  profileImageURI: string,
): Promise<string> {
  try {
    const signer = await getSigner();
    const config = NETWORKS["baseSepolia"];

    // TODO: Load ABI from compiled artifacts
    const creatorRegistry = new ethers.Contract(
      config.creatorRegistryAddress,
      ["function mintCreator(address,string,string,string) external returns (uint256)"],
      signer,
    );

    const tx = await creatorRegistry.mintCreator(creatorAddress, username, bio, profileImageURI);
    const receipt = await tx.wait();

    console.log("Creator NFT minted:", receipt?.transactionHash);
    return receipt?.transactionHash || "";
  } catch (error) {
    console.error("Error minting creator NFT:", error);
    throw error;
  }
}

/**
 * Buy IP tokens via marketplace
 */
export async function buyIPTokens(ipTokenAddress: string, usdAmount: number): Promise<string> {
  try {
    const signer = await getSigner();
    const config = NETWORKS["baseSepolia"];

    const ipMarketplace = new ethers.Contract(
      config.ipMarketplaceAddress,
      ["function buyTokens(address,uint256) external nonReentrant returns (uint256)"],
      signer,
    );

    const tx = await ipMarketplace.buyTokens(
      ipTokenAddress,
      ethers.parseEther(usdAmount.toString()),
    );
    const receipt = await tx.wait();

    // Record on-chain transaction
    console.log("Buy transaction recorded on-chain:", receipt?.transactionHash);
    return receipt?.transactionHash || "";
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw error;
  }
}

/**
 * Sell IP tokens via marketplace
 */
export async function sellIPTokens(ipTokenAddress: string, tokenAmount: number): Promise<string> {
  try {
    const signer = await getSigner();
    const config = NETWORKS["baseSepolia"];

    const ipMarketplace = new ethers.Contract(
      config.ipMarketplaceAddress,
      ["function sellTokens(address,uint256) external nonReentrant returns (uint256)"],
      signer,
    );

    const tx = await ipMarketplace.sellTokens(
      ipTokenAddress,
      ethers.parseEther(tokenAmount.toString()),
    );
    const receipt = await tx.wait();

    // Record on-chain transaction
    console.log("Sell transaction recorded on-chain:", receipt?.transactionHash);
    return receipt?.transactionHash || "";
  } catch (error) {
    console.error("Error selling tokens:", error);
    throw error;
  }
}

/**
 * Get user's on-chain transaction history
 */
export async function getUserTransactionHistory(userAddress: string): Promise<unknown[]> {
  try {
    const provider = getProvider("baseSepolia");
    const config = NETWORKS["baseSepolia"];

    const ipMarketplace = new ethers.Contract(
      config.ipMarketplaceAddress,
      ["function getUserTransactions(address) external view returns (tuple[])"],
      provider,
    );

    const transactions = await ipMarketplace.getUserTransactions(userAddress);
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

/**
 * Switch network in wallet (supports any EIP-1193 compatible wallet)
 */
export async function switchNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error(
      "No Web3 wallet detected. Please install MetaMask, Zerion, Coinbase Wallet, or another EIP-1193 compatible wallet.",
    );
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 4902) {
      // Network not added, need to add it first
      console.log("Network not in wallet, would need to add it");
    } else {
      throw error;
    }
  }
}

// Type augmentation for window object
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default {
  getProvider,
  getSigner,
  connectWallet,
  getBalance,
  mintCreatorNFT,
  buyIPTokens,
  sellIPTokens,
  getUserTransactionHistory,
  switchNetwork,
};
