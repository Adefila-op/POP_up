import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserProvider } from "ethers";
import {
  AppStateContext,
  type MarketListing,
  type AppStateContextValue,
  type AppStateSnapshot,
} from "@/lib/app-state-context";
import { CONTENT, CREATORS, type ContentItem, type IpAsset, getCreatorByName } from "@/lib/data";
import { authAPI, ipAPI, transactionAPI, type User, type IP } from "@/lib/api-client";

const STORAGE_KEY = "popup-app-state-v1";
const AUTH_TOKEN_KEY = "auth_token";
const DEMO_CREATOR_NAME = "Mira Osei";

const typeCategory: Record<ContentItem["type"], string> = {
  pdf: "Guide",
  art: "Artwork",
  tool: "Tool",
};

const typeCover: Record<ContentItem["type"], string> = {
  pdf: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=70",
  art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=70",
  tool: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=70",
};

// Convert API IP to frontend IpAsset format
const apiIPToIpAsset = (ip: IP): IpAsset => ({
  id: ip.id,
  title: ip.title,
  creator: ip.creator_id,
  cover: ip.cover_image_url || typeCover.art,
  category: ip.category || "Digital Asset",
  shares: ip.total_supply || 1000,
  pricePerShare: (ip.current_price || 100) / 100,
  monthlyRevenue: Math.round((ip.current_liquidity || 0) / 10) || 250,
  change24h: 0,
  description: ip.description || "Fractionalized digital asset",
});

const seedListings = (id: string, basePrice: number): MarketListing[] => {
  const seed = id.charCodeAt(id.length - 1) || 1;
  const sellers = [
    { n: "Mira O.", a: "MO" },
    { n: "Devon L.", a: "DL" },
    { n: "Eden C.", a: "EC" },
    { n: "Otto V.", a: "OV" },
    { n: "Kai R.", a: "KR" },
    { n: "Nova S.", a: "NS" },
  ];

  return sellers.map((seller, i) => {
    const drift = ((seed + i * 3) % 9) - 4;
    const price = Math.max(0.5, +(basePrice + drift * (basePrice * 0.05)).toFixed(2));
    const qty = ((seed + i) % 5) + 1;
    const ages = ["2m ago", "14m ago", "1h ago", "3h ago", "9h ago", "1d ago"];
    return {
      id: `${id}-l${i}`,
      ipId: id,
      seller: seller.n,
      avatar: seller.a,
      qty,
      price,
      listedAgo: ages[i % ages.length],
    };
  });
};

const initialSnapshot: AppStateSnapshot = {
  signedIn: false,
  creatorWhitelisted: false,
  walletConnected: false,
  pushEnabled: true,
  cashBalance: 0, // Will be set from API
  ownedContentIds: [],
  followedCreatorSlugs: [],
  savedContentIds: [],
  likedContentIds: [],
  createdContent: [],
  createdIpAssets: [],
  marketListings: [], // Will load from API
  ipHoldings: {},
  contentOrders: [],
  contentPurchaseCounts: {},
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(initialSnapshot);
  const [user, setUser] = useState<User | null>(null);
  const [apiIPs, setApiIPs] = useState<IP[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Restore auth on mount
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        try {
          const profile = await authAPI.getProfile();
          setUser(profile);
          setState((prev) => ({
            ...prev,
            signedIn: true,
            walletConnected: true,
            cashBalance: profile.cash_balance / 100,
          }));
        } catch (error) {
          console.error("Failed to restore auth:", error);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      }
    };

    restoreAuth();
    // Load IP data on mount
    loadIPData();
  }, []);

  // Load IP data from API
  const loadIPData = async () => {
    try {
      const ips = await ipAPI.list();
      setApiIPs(ips);
      // Update state with fetched IPs as market listings
      const listings = ips.flatMap((ip) => seedListings(ip.id, ip.current_price).slice(0, 3));
      setState((prev) => ({
        ...prev,
        marketListings: listings,
      }));
    } catch (error) {
      console.error("Failed to load IPs:", error);
    }
  };

  // Restore local state on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppStateSnapshot>;
      setState((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore localStorage hydration failures
    }
  }, []);

  // Persist state
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore persistence failures
    }
  }, [state]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      contentCatalog: [...state.createdContent].map((item) => ({
        ...item,
        sales: item.sales + (state.contentPurchaseCounts[item.id] ?? 0),
      })),
      ipCatalog: [...state.createdIpAssets, ...apiIPs.map(apiIPToIpAsset)],

      // ===== REAL WALLET CONNECT =====
      connectWallet: async () => {
        try {
          setIsLoading(true);
          if (!window.ethereum) {
            throw new Error(
              "No Web3 wallet detected. Please install one: MetaMask (metamask.io), Zerion (zerion.io), Coinbase Wallet, or WalletConnect",
            );
          }

          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          const walletAddress = accounts[0];

          if (!walletAddress) throw new Error("No wallet selected");

          setState((prev) => ({
            ...prev,
            walletConnected: true,
          }));

          return { ok: true as const };
        } catch (error) {
          console.error("Wallet connection failed:", error);
          return { ok: false as const, reason: (error as Error).message };
        } finally {
          setIsLoading(false);
        }
      },

      disconnectWallet: () => {
        setState((prev) => ({
          ...prev,
          walletConnected: false,
        }));
      },

      // ===== REAL AUTHENTICATION =====
      signIn: async () => {
        try {
          setIsLoading(true);

          if (!window.ethereum) {
            throw new Error(
              "No Web3 wallet detected. Please install one: MetaMask (metamask.io), Zerion (zerion.io), Coinbase Wallet, or WalletConnect",
            );
          }

          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const walletAddress = await signer.getAddress();

          // Generate authentication message
          const message = `creator-commerce-hub:${Date.now()}:${Math.random()
            .toString(36)
            .substring(7)}`;

          // Sign the message
          const signature = await signer.signMessage(message);

          // Login to backend
          const { user: apiUser, token } = await authAPI.login(walletAddress, message, signature);

          // Store token
          localStorage.setItem(AUTH_TOKEN_KEY, token);

          setUser(apiUser);
          setState((prev) => ({
            ...prev,
            signedIn: true,
            walletConnected: true,
            cashBalance: apiUser.cash_balance / 100,
          }));

          // Load user data
          await loadIPData();

          return { ok: true as const };
        } catch (error) {
          console.error("Sign in failed:", error);
          return { ok: false as const, reason: (error as Error).message };
        } finally {
          setIsLoading(false);
        }
      },

      signOut: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setState((prev) => ({
          ...prev,
          signedIn: false,
          creatorWhitelisted: false,
          walletConnected: false,
        }));
      },

      enableCreatorWhitelist: async () => {
        try {
          if (!user) throw new Error("Not signed in");

          // Update user to be a creator
          const updated = await authAPI.updateProfile({
            ...user,
            is_creator: true,
          });

          setUser(updated);
          setState((prev) => ({
            ...prev,
            creatorWhitelisted: true,
          }));

          return { ok: true as const };
        } catch (error) {
          console.error("Creator enable failed:", error);
          return { ok: false as const, reason: (error as Error).message };
        }
      },

      setPushEnabled: (enabled: boolean) => {
        setState((prev) => ({ ...prev, pushEnabled: enabled }));
      },

      // ===== IP/PRODUCT OPERATIONS =====
      publishContent: async ({ type, title, description, price, tokenize, fileName }) => {
        try {
          if (!user || !state.walletConnected) {
            return { contentId: "", ipId: "", error: "Not authenticated" };
          }

          const now = Date.now();
          const creator = getCreatorByName(DEMO_CREATOR_NAME) ?? CREATORS[0];
          const contentId = `ugc-${now}`;

          // Create content locally
          const nextContent: ContentItem = {
            id: contentId,
            title,
            creator: creator.name,
            creatorAvatar: creator.avatar,
            type,
            price,
            cover: typeCover[type],
            description,
            rating: 0,
            sales: 0,
            category: typeCategory[type],
            pages: type === "pdf" ? 24 : undefined,
            fileSize: type === "tool" ? "24 MB" : undefined,
            platform: type === "tool" ? "macOS | Windows" : undefined,
            artStyle: type === "art" ? "Original" : undefined,
          };

          let ipId = "";

          // If tokenizing, create IP asset on backend
          if (tokenize) {
            const initialLiquidity = price;
            const newIP = await ipAPI.create({
              title,
              description,
              category: typeCategory[type],
              coverImageUrl: typeCover[type],
              initialLiquidityUSD: initialLiquidity,
              launchDurationDays: 14,
            });

            ipId = newIP.id;

            // Add to user's holdings
            setState((prev) => ({
              ...prev,
              ipHoldings: {
                ...prev.ipHoldings,
                [ipId]: 250, // Initial allocation
              },
            }));
          }

          setState((prev) => ({
            ...prev,
            createdContent: [nextContent, ...prev.createdContent],
            ownedContentIds: [contentId, ...prev.ownedContentIds],
          }));

          return { contentId, ipId };
        } catch (error) {
          console.error("Publish failed:", error);
          return { contentId: "", ipId: "", error: (error as Error).message };
        }
      },

      // ===== TRADING OPERATIONS =====
      buyIpListing: async (listingId: string) => {
        try {
          if (!state.walletConnected) {
            return { ok: false as const, reason: "Connect your wallet first" };
          }

          const listing = state.marketListings.find((item) => item.id === listingId);
          if (!listing) return { ok: false as const, reason: "Listing not found" };

          // Execute buy on backend
          const total = listing.qty * listing.price;
          await transactionAPI.buy(listing.ipId, total);

          // Update local state
          setState((prev) => ({
            ...prev,
            cashBalance: +(prev.cashBalance - total).toFixed(2),
            marketListings: prev.marketListings.filter((item) => item.id !== listingId),
            ipHoldings: {
              ...prev.ipHoldings,
              [listing.ipId]: (prev.ipHoldings[listing.ipId] ?? 0) + listing.qty,
            },
          }));

          return { ok: true as const, qty: listing.qty, price: listing.price };
        } catch (error) {
          console.error("Buy failed:", error);
          return { ok: false as const, reason: (error as Error).message };
        }
      },

      sellIpToPool: async ({ ipId, qty, pricePerShare }) => {
        try {
          if (!state.walletConnected) {
            return { ok: false as const, reason: "Connect your wallet first" };
          }

          const available = state.ipHoldings[ipId] ?? 0;
          if (available < qty) {
            return { ok: false as const, reason: "Not enough shares" };
          }

          // Execute sell on backend
          const total = qty * pricePerShare;
          await transactionAPI.sell(ipId, qty);

          // Update local state
          setState((prev) => ({
            ...prev,
            cashBalance: +(prev.cashBalance + total).toFixed(2),
            ipHoldings: {
              ...prev.ipHoldings,
              [ipId]: (prev.ipHoldings[ipId] ?? 0) - qty,
            },
          }));

          return { ok: true as const, proceeds: total };
        } catch (error) {
          console.error("Sell failed:", error);
          return { ok: false as const, reason: (error as Error).message };
        }
      },

      // ===== MOCK OPERATIONS (unchanged for compatibility) =====
      purchaseContent: (contentId: string) => {
        const item = [...state.createdContent, ...CONTENT].find(
          (content) => content.id === contentId,
        );
        if (!item) return { ok: false, reason: "Content not found." };
        if (state.ownedContentIds.includes(contentId)) {
          return { ok: true, alreadyOwned: true, price: item.price };
        }
        if (item.price > state.cashBalance) {
          return { ok: false, reason: "Not enough balance to complete this purchase." };
        }

        setState((prev) => ({
          ...prev,
          cashBalance: +(prev.cashBalance - item.price).toFixed(2),
          ownedContentIds: [contentId, ...prev.ownedContentIds],
          contentOrders: [
            {
              id: `order-${contentId}-${Date.now()}`,
              contentId,
              title: item.title,
              amount: item.price,
              createdAt: Date.now(),
            },
            ...prev.contentOrders,
          ],
          contentPurchaseCounts: {
            ...prev.contentPurchaseCounts,
            [contentId]: (prev.contentPurchaseCounts[contentId] ?? 0) + 1,
          },
        }));

        return { ok: true, price: item.price };
      },

      toggleFollowCreator: (slug: string) => {
        let following = false;
        setState((prev) => {
          const exists = prev.followedCreatorSlugs.includes(slug);
          following = !exists;
          return {
            ...prev,
            followedCreatorSlugs: exists
              ? prev.followedCreatorSlugs.filter((item) => item !== slug)
              : [slug, ...prev.followedCreatorSlugs],
          };
        });
        return following;
      },

      toggleSavedContent: (contentId: string) => {
        let saved = false;
        setState((prev) => {
          const exists = prev.savedContentIds.includes(contentId);
          saved = !exists;
          return {
            ...prev,
            savedContentIds: exists
              ? prev.savedContentIds.filter((item) => item !== contentId)
              : [contentId, ...prev.savedContentIds],
          };
        });
        return saved;
      },

      toggleLikedContent: (contentId: string) => {
        let liked = false;
        setState((prev) => {
          const exists = prev.likedContentIds.includes(contentId);
          liked = !exists;
          return {
            ...prev,
            likedContentIds: exists
              ? prev.likedContentIds.filter((item) => item !== contentId)
              : [contentId, ...prev.likedContentIds],
          };
        });
        return liked;
      },

      createIpListing: ({ ipId, qty, price }) => {
        if (!state.walletConnected) {
          return { ok: false, reason: "Connect your wallet before listing shares." };
        }
        const available = state.ipHoldings[ipId] ?? 0;
        if (qty < 1 || price <= 0)
          return { ok: false, reason: "Enter a valid quantity and price." };
        if (available < qty) return { ok: false, reason: "You do not own enough shares." };

        setState((prev) => ({
          ...prev,
          marketListings: [
            {
              id: `${ipId}-u-${Date.now()}`,
              ipId,
              seller: "You",
              avatar: "YO",
              qty,
              price,
              listedAgo: "just now",
            },
            ...prev.marketListings,
          ],
          ipHoldings: {
            ...prev.ipHoldings,
            [ipId]: (prev.ipHoldings[ipId] ?? 0) - qty,
          },
        }));

        return { ok: true };
      },

      cancelIpListing: (listingId: string) => {
        const listing = state.marketListings.find((item) => item.id === listingId);
        if (!listing) return { ok: false };

        setState((prev) => ({
          ...prev,
          marketListings: prev.marketListings.filter((item) => item.id !== listingId),
          ipHoldings:
            listing.seller === "You"
              ? {
                  ...prev.ipHoldings,
                  [listing.ipId]: (prev.ipHoldings[listing.ipId] ?? 0) + listing.qty,
                }
              : prev.ipHoldings,
        }));

        return { ok: true };
      },
    }),
    [apiIPs, state, user],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
