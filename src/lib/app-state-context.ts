import { createContext } from "react";
import type { ContentItem, IpAsset } from "@/lib/data";

export type MarketListing = {
  id: string;
  ipId: string;
  seller: string;
  avatar: string;
  qty: number;
  price: number;
  listedAgo: string;
};

export type ContentOrder = {
  id: string;
  contentId: string;
  title: string;
  amount: number;
  createdAt: number;
};

export type AppStateSnapshot = {
  signedIn: boolean;
  creatorWhitelisted: boolean;
  walletConnected: boolean;
  pushEnabled: boolean;
  cashBalance: number;
  ownedContentIds: string[];
  followedCreatorSlugs: string[];
  savedContentIds: string[];
  likedContentIds: string[];
  createdContent: ContentItem[];
  createdIpAssets: IpAsset[];
  marketListings: MarketListing[];
  ipHoldings: Record<string, number>;
  contentOrders: ContentOrder[];
  contentPurchaseCounts: Record<string, number>;
};

export type AppStateContextValue = AppStateSnapshot & {
  contentCatalog: ContentItem[];
  ipCatalog: IpAsset[];
  signIn: () => void;
  signOut: () => void;
  enableCreatorWhitelist: () => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  setPushEnabled: (enabled: boolean) => void;
  purchaseContent: (contentId: string) => {
    ok: boolean;
    reason?: string;
    alreadyOwned?: boolean;
    price?: number;
  };
  publishContent: (input: {
    type: ContentItem["type"];
    title: string;
    description: string;
    price: number;
    tokenize: boolean;
    fileName: string;
  }) => { contentId: string; ipId?: string };
  toggleFollowCreator: (slug: string) => boolean;
  toggleSavedContent: (contentId: string) => boolean;
  toggleLikedContent: (contentId: string) => boolean;
  buyIpListing: (listingId: string) => { ok: boolean; reason?: string; qty?: number; price?: number };
  createIpListing: (input: { ipId: string; qty: number; price: number }) => { ok: boolean; reason?: string };
  cancelIpListing: (listingId: string) => { ok: boolean };
  sellIpToPool: (input: {
    ipId: string;
    qty: number;
    pricePerShare: number;
  }) => { ok: boolean; reason?: string; proceeds?: number };
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);
