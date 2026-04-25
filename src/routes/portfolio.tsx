import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Wallet, Coins, Library, ShieldCheck, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/use-app-state";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Orisale" },
      { name: "description", content: "Your library, IP holdings, and pool stakes on Orisale." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { walletConnected, connectWallet, contentCatalog, ipCatalog, ownedContentIds, ipHoldings, cashBalance, contentOrders, savedContentIds, createdIpAssets } =
    useAppState();
  const [view, setView] = useState<"portfolio" | "creator">("portfolio");
  const [isConnecting, setIsConnecting] = useState(false);
  
  const library = contentCatalog.filter((item) => ownedContentIds.includes(item.id));
  const saved = contentCatalog.filter((item) => savedContentIds.includes(item.id));
  const holdings = ipCatalog
    .map((ip) => ({ ip, shares: ipHoldings[ip.id] ?? 0 }))
    .filter((holding) => holding.shares > 0);

  const totalIp = holdings.reduce((s, h) => s + h.shares * h.ip.pricePerShare, 0);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      if (result.ok) {
        toast.success("Wallet connected! Sign in to continue.");
      } else {
        toast.error(result.reason || "Failed to connect wallet");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!walletConnected) {
    return (
      <AppShell title="Portfolio" subtitle="Connect your wallet first">
        <section className="rounded-3xl bg-card p-6 shadow-pop">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Connect a wallet to unlock your portfolio</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your holdings, library, and pool positions stay hidden until a wallet is connected.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            <Mini label="Wallet" value="Required" />
            <Mini label="Library" value="Locked" />
            <Mini label="IP" value="Locked" />
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-ink-foreground shadow-ink disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect wallet"}
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Portfolio" subtitle="Your library, IP & pools">
      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("portfolio")}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
            view === "portfolio"
              ? "bg-ink text-ink-foreground"
              : "bg-card text-foreground hover:bg-secondary"
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-2" />
          My Holdings
        </button>
        <button
          onClick={() => setView("creator")}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
            view === "creator"
              ? "bg-ink text-ink-foreground"
              : "bg-card text-foreground hover:bg-secondary"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Creator Dashboard
        </button>
      </div>

      {view === "portfolio" ? (
        <>
      <section className="rounded-3xl bg-ink p-6 text-ink-foreground shadow-ink">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Total balance</p>
            <p className="mt-1 text-3xl font-bold">${(totalIp + cashBalance).toFixed(2)}</p>
          </div>
          <Wallet className="h-6 w-6 opacity-60" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <Mini label="Cash" value={`$${cashBalance.toFixed(2)}`} />
          <Mini label="IP value" value={`$${totalIp.toFixed(0)}`} />
        </div>
      </section>

      {/* IP Holdings */}
      <section className="mt-6">
        <SectionHead icon={<Coins className="h-4 w-4" />} title="IP holdings" />
        <div className="space-y-3">
          {holdings.map(({ ip, shares }) => (
            <Link
              key={ip.id}
              to="/ip/$id"
              params={{ id: ip.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
            >
              <img src={ip.cover} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{ip.title}</p>
                <p className="text-xs text-muted-foreground">{shares} shares</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${(shares * ip.pricePerShare).toFixed(2)}</p>
                <p
                  className={`text-xs font-semibold ${ip.change24h >= 0 ? "text-success" : "text-destructive"}`}
                >
                  <TrendingUp
                    className={`inline h-3 w-3 ${ip.change24h < 0 ? "rotate-180" : ""}`}
                  />{" "}
                  {ip.change24h >= 0 ? "+" : ""}
                  {ip.change24h}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Library */}
      <section className="mt-6">
        <SectionHead icon={<Library className="h-4 w-4" />} title="My library" />
        <div className="space-y-3">
          {library.map((item) => (
            <Link
              key={item.id}
              to="/content/$id"
              params={{ id: item.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
            >
              <img src={item.cover} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {item.type} · {item.creator}
                </p>
              </div>
              <span className="rounded-full bg-success/15 px-2 py-1 text-[10px] font-semibold text-success-foreground">
                Owned
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionHead icon={<Wallet className="h-4 w-4" />} title="Recent orders" />
        <div className="space-y-3">
          {contentOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="rounded-2xl bg-card p-3 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{order.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold">{order.amount === 0 ? "Free" : `-$${order.amount.toFixed(2)}`}</p>
              </div>
            </div>
          ))}
          {contentOrders.length === 0 && (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">
              No purchases yet.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <SectionHead icon={<ShieldCheck className="h-4 w-4" />} title="Saved items" />
        <div className="space-y-3">
          {saved.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              to="/content/$id"
              params={{ id: item.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
            >
              <img src={item.cover} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.creator}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                Saved
              </span>
            </Link>
          ))}
          {saved.length === 0 && (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">
              Save items from Discover to keep them here.
            </p>
          )}
        </div>
      </section>
        </>
      ) : (
      /* Creator Dashboard View */
      <>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-3xl bg-card p-4 shadow-soft">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="mt-2 text-2xl font-bold">${(createdIpAssets.length * 5000 + contentCatalog.length * 1000).toFixed(0)}</p>
          </section>
          <section className="rounded-3xl bg-card p-4 shadow-soft">
            <p className="text-xs text-muted-foreground">Active IPs</p>
            <p className="mt-2 text-2xl font-bold">{createdIpAssets.length}</p>
          </section>
        </div>

        {/* Launch IP Section */}
        <section className="mt-6">
          <SectionHead icon={<Coins className="h-4 w-4" />} title="Your IP Assets" />
          <Link 
            to="/creator"
            className="block rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-soft text-white hover:shadow-lg transition"
          >
            <p className="font-semibold flex items-center gap-2">
              <span className="text-xl">⚡</span> Launch IP Asset
            </p>
            <p className="text-xs mt-1 opacity-90">Create and tokenize your intellectual property</p>
          </Link>
          {createdIpAssets.length === 0 && (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft mt-3">
              No IP assets yet. Launch your first IP to get started.
            </p>
          )}
          {createdIpAssets.map((ip) => (
            <Link
              key={ip.id}
              to="/ip/$id"
              params={{ id: ip.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft mt-3 hover:shadow-lg transition"
            >
              <img src={ip.cover} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{ip.title}</p>
                <p className="text-xs text-muted-foreground">{ip.totalSupply} tokens</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${ip.pricePerShare.toFixed(2)}</p>
                <p className="text-xs text-success">+5.2%</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Products Section */}
        <section className="mt-6">
          <SectionHead icon={<Library className="h-4 w-4" />} title="Your Products" />
          {contentCatalog.length === 0 ? (
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="text-sm text-muted-foreground">No products yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Navigate to Upload to add your first product.</p>
            </div>
          ) : (
            contentCatalog.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to="/content/$id"
                params={{ id: item.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft mt-3 hover:shadow-lg transition"
              >
                <img src={item.cover} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type} · ${item.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{item.sales} sales</p>
                  <p className="text-xs text-muted-foreground">⭐ {item.rating}</p>
                </div>
              </Link>
            ))
          )}
        </section>

        {/* Repost to Discovery */}
        <section className="mt-6">
          <SectionHead icon={<TrendingUp className="h-4 w-4" />} title="Repost & Promote" />
          <Link 
            to="/creator"
            className="block rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 shadow-soft text-white hover:shadow-lg transition"
          >
            <p className="font-semibold flex items-center gap-2">
              <span className="text-xl">📢</span> Repost Product to Discovery
            </p>
            <p className="text-xs mt-1 opacity-90">Share your products with the creator community</p>
          </Link>
        </section>
      </>
      )}
    </AppShell>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <h2 className="font-bold">{title}</h2>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-[10px] opacity-70">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
