import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppStateContext,
  type MarketListing,
  type AppStateContextValue,
  type AppStateSnapshot,
} from "@/lib/app-state-context";
import { CONTENT, CREATORS, IP_ASSETS, type ContentItem, type IpAsset, getCreatorByName } from "@/lib/data";

const STORAGE_KEY = "popup-app-state-v1";
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
  cashBalance: 245,
  ownedContentIds: ["c1", "c3"],
  followedCreatorSlugs: [],
  savedContentIds: [],
  likedContentIds: [],
  createdContent: [],
  createdIpAssets: [],
  marketListings: IP_ASSETS.flatMap((asset) => seedListings(asset.id, asset.pricePerShare)),
  ipHoldings: {
    ip1: 50,
    ip3: 12,
  },
  contentOrders: [],
  contentPurchaseCounts: {},
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateSnapshot>(initialSnapshot);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppStateSnapshot>;
      setState((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore localStorage hydration failures in the demo.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore persistence failures in the demo.
    }
  }, [state]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      contentCatalog: [...state.createdContent, ...CONTENT].map((item) => ({
        ...item,
        sales: item.sales + (state.contentPurchaseCounts[item.id] ?? 0),
      })),
      ipCatalog: [...state.createdIpAssets, ...IP_ASSETS],
      signIn: () => setState((prev) => ({ ...prev, signedIn: true })),
      signOut: () =>
        setState((prev) => ({
          ...prev,
          signedIn: false,
          creatorWhitelisted: false,
          walletConnected: false,
        })),
      enableCreatorWhitelist: () => setState((prev) => ({ ...prev, creatorWhitelisted: true })),
      connectWallet: () => setState((prev) => ({ ...prev, walletConnected: true })),
      disconnectWallet: () => setState((prev) => ({ ...prev, walletConnected: false })),
      setPushEnabled: (enabled: boolean) => setState((prev) => ({ ...prev, pushEnabled: enabled })),
      purchaseContent: (contentId: string) => {
        const item = [...state.createdContent, ...CONTENT].find((content) => content.id === contentId);
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
      publishContent: ({ type, title, description, price, tokenize, fileName }) => {
        const now = Date.now();
        const creator = getCreatorByName(DEMO_CREATOR_NAME) ?? CREATORS[0];
        const contentId = `ugc-${now}`;
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

        const maybeIp: IpAsset | null = tokenize
          ? {
              id: `uip-${now}`,
              title,
              creator: creator.name,
              cover: typeCover[type],
              category: typeCategory[type],
              shares: 1000,
              pricePerShare: Math.max(1, +(price / 10 || 1).toFixed(2)),
              monthlyRevenue: Math.max(250, Math.round(price * 42)),
              change24h: 0,
              description: `Fractionalized rights for ${title}. Source file: ${fileName}.`,
            }
          : null;

        setState((prev) => ({
          ...prev,
          createdContent: [nextContent, ...prev.createdContent],
          ownedContentIds: [contentId, ...prev.ownedContentIds],
          createdIpAssets: maybeIp ? [maybeIp, ...prev.createdIpAssets] : prev.createdIpAssets,
          ipHoldings: maybeIp
            ? { ...prev.ipHoldings, [maybeIp.id]: (prev.ipHoldings[maybeIp.id] ?? 0) + 250 }
            : prev.ipHoldings,
        }));

        return { contentId, ipId: maybeIp?.id };
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
      buyIpListing: (listingId: string) => {
        if (!state.walletConnected) {
          return { ok: false, reason: "Connect your wallet before buying IP." };
        }
        const listing = state.marketListings.find((item) => item.id === listingId);
        if (!listing) return { ok: false, reason: "Listing not found." };

        const total = +(listing.qty * listing.price).toFixed(2);
        if (state.cashBalance < total) {
          return { ok: false, reason: "Not enough cash balance." };
        }

        setState((prev) => ({
          ...prev,
          cashBalance: +(prev.cashBalance - total).toFixed(2),
          marketListings: prev.marketListings.filter((item) => item.id !== listingId),
          ipHoldings: {
            ...prev.ipHoldings,
            [listing.ipId]: (prev.ipHoldings[listing.ipId] ?? 0) + listing.qty,
          },
        }));

        return { ok: true, qty: listing.qty, price: listing.price };
      },
      createIpListing: ({ ipId, qty, price }) => {
        if (!state.walletConnected) {
          return { ok: false, reason: "Connect your wallet before listing shares." };
        }
        const available = state.ipHoldings[ipId] ?? 0;
        if (qty < 1 || price <= 0) return { ok: false, reason: "Enter a valid quantity and price." };
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
      sellIpToPool: ({ ipId, qty, pricePerShare }) => {
        if (!state.walletConnected) {
          return { ok: false, reason: "Connect your wallet before selling to the pool." };
        }
        const available = state.ipHoldings[ipId] ?? 0;
        if (qty < 1) return { ok: false, reason: "Enter a valid quantity." };
        if (available < qty) return { ok: false, reason: "Not enough shares available." };

        const proceeds = +(qty * pricePerShare).toFixed(2);
        setState((prev) => ({
          ...prev,
          cashBalance: +(prev.cashBalance + proceeds).toFixed(2),
          ipHoldings: {
            ...prev.ipHoldings,
            [ipId]: (prev.ipHoldings[ipId] ?? 0) - qty,
          },
        }));

        return { ok: true, proceeds };
      },
    }),
    [state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
