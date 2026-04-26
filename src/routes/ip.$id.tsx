import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, Tag, Plus, ShoppingBag, RefreshCcw, Layers } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getIp } from "@/lib/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/use-app-state";
import type { MarketListing } from "@/lib/app-state-context";

export const Route = createFileRoute("/ip/$id")({
  component: IpDetailPage,
  notFoundComponent: () => (
    <AppShell title="Not found">
      <p className="py-20 text-center text-muted-foreground">IP not found.</p>
    </AppShell>
  ),
});

function IpDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    ipCatalog,
    marketListings,
    ipHoldings,
    cashBalance,
    walletConnected,
    buyIpListing,
    createIpListing,
    cancelIpListing,
    sellIpToPool,
  } = useAppState();
  const ip = ipCatalog.find((asset) => asset.id === id) ?? getIp(id);

  const [showListForm, setShowListForm] = useState(false);
  const [listQty, setListQty] = useState(1);
  const [listPrice, setListPrice] = useState(ip?.pricePerShare ?? 1);

  const listings = useMemo(
    () => marketListings.filter((listing) => listing.ipId === id),
    [id, marketListings],
  );
  const sorted = useMemo(() => [...listings].sort((a, b) => a.price - b.price), [listings]);
  const ownedShares = ipHoldings[id] ?? 0;

  const floor = sorted[0]?.price ?? 0;
  const totalSupply = listings.reduce((sum, listing) => sum + listing.qty, 0);
  const avgPrice = totalSupply
    ? listings.reduce((sum, listing) => sum + listing.price * listing.qty, 0) / totalSupply
    : 0;
  const liquidity = ip ? Math.round(ip.monthlyRevenue * 4.2) : 0;
  const coverage =
    avgPrice * totalSupply > 0 ? Math.min(1, liquidity / (avgPrice * totalSupply)) : 0;
  const buybackPrice = +(avgPrice * (0.85 + coverage * 0.1)).toFixed(2);

  if (!ip) {
    return (
      <AppShell title="Not found">
        <p className="py-20 text-center text-muted-foreground">IP not found.</p>
      </AppShell>
    );
  }

  const handleBuy = async (listing: MarketListing) => {
    const result = await buyIpListing(listing.id);
    if (!result.ok) {
      toast.error(result.reason ?? "Could not complete purchase.");
      return;
    }

    toast.success(`Bought ${listing.qty}x ${ip.title}`, {
      description: `From ${listing.seller} at $${listing.price} each`,
    });
  };

  const handleList = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createIpListing({ ipId: ip.id, qty: listQty, price: +listPrice });
    if (!result.ok) {
      toast.error(result.reason ?? "Could not create listing.");
      return;
    }

    setShowListForm(false);
    toast.success(`Listed ${listQty} for $${listPrice} each`);
  };

  const handleBuyback = async () => {
    const result = await sellIpToPool({ ipId: ip.id, qty: 1, pricePerShare: buybackPrice });
    if (!result.ok) {
      toast.error(result.reason ?? "Could not sell to pool.");
      return;
    }

    toast.success(`Buyback offer accepted at $${buybackPrice}`, {
      description: `Pool liquidity: $${liquidity.toLocaleString()}`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative h-60 w-full overflow-hidden">
        <img src={ip.cover} alt={ip.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => navigate({ to: "/marketplace" })}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto -mt-12 max-w-md space-y-5 px-5">
        <div className="rounded-3xl bg-card p-6 shadow-pop">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{ip.category}</p>
              <h1 className="mt-1 truncate text-2xl font-bold">{ip.title}</h1>
              <p className="text-sm text-muted-foreground">by {ip.creator}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                ip.change24h >= 0
                  ? "bg-success/15 text-success-foreground"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              <TrendingUp className={cn("mr-1 inline h-3 w-3", ip.change24h < 0 && "rotate-180")} />
              {ip.change24h >= 0 ? "+" : ""}
              {ip.change24h}%
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="Floor" value={`$${floor.toFixed(2)}`} highlight />
            <Stat label="Avg price" value={`$${avgPrice.toFixed(2)}`} />
            <Stat label="Owned" value={`${ownedShares}`} />
          </div>
        </div>

        <div className="rounded-3xl bg-ink p-5 text-ink-foreground shadow-ink">
          <div className="flex items-center gap-2 text-xs opacity-80">
            <RefreshCcw className="h-3.5 w-3.5" /> Protocol buyback
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold">${buybackPrice}</p>
              <p className="text-[11px] opacity-70">per share - instant exit</p>
            </div>
            <button
              onClick={() => void handleBuyback()}
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              Sell 1 to pool
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[11px]">
            <div>
              <p className="opacity-60">Liquidity available</p>
              <p className="text-sm font-semibold">${liquidity.toLocaleString()}</p>
            </div>
            <div>
              <p className="opacity-60">Avg price / coverage</p>
              <p className="text-sm font-semibold">
                ${avgPrice.toFixed(2)} / {(coverage * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Stat label="Cash balance" value={`$${cashBalance.toFixed(2)}`} />
            <Stat label="Wallet" value={walletConnected ? "Connected" : "Required"} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Layers className="h-3.5 w-3.5" />
              </span>
              <h2 className="font-bold">Listings</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {listings.length}
              </span>
            </div>
            <button
              onClick={() => setShowListForm((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              <Plus className="h-3.5 w-3.5" />
              List yours
            </button>
          </div>

          {showListForm && (
            <form
              onSubmit={handleList}
              className="mb-4 space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary-soft p-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={listQty}
                    onChange={(e) => setListQty(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Price (USD)
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={listPrice}
                    onChange={(e) => setListPrice(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {walletConnected
                  ? `You currently have ${ownedShares} shares available to list.`
                  : "Connect your wallet from Portfolio before trading IP."}
              </p>
              <button
                type="submit"
                disabled={!walletConnected}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-sm font-semibold text-ink-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Tag className="h-4 w-4" />
                {walletConnected ? "Confirm listing" : "Wallet required"}
              </button>
            </form>
          )}

          <div className="space-y-2">
            {sorted.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No active listings yet.
              </p>
            )}
            {sorted.map((listing, i) => {
              const isFloor = i === 0;
              const isYou = listing.seller === "You";
              return (
                <div
                  key={listing.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-background p-3 transition-colors",
                    isFloor ? "border-primary/40 bg-primary-soft" : "border-border",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-warning text-[11px] font-bold text-primary-foreground">
                    {listing.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{listing.seller}</p>
                      {isFloor && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                          Floor
                        </span>
                      )}
                      {isYou && (
                        <span className="rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {listing.qty}x • {listing.listedAgo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold">${listing.price.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      total ${(listing.price * listing.qty).toFixed(2)}
                    </p>
                  </div>
                  {!isYou ? (
                    <button
                      onClick={() => void handleBuy(listing)}
                      disabled={!walletConnected}
                      className="ml-1 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-ink-foreground transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Buy
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        cancelIpListing(listing.id);
                        toast("Listing cancelled");
                      }}
                      className="ml-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2",
        highlight ? "bg-primary text-primary-foreground" : "bg-secondary",
      )}
    >
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider",
          highlight ? "opacity-80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
