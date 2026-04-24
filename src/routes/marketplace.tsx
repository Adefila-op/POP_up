import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IP_ASSETS } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "IP Marketplace — Orisale" },
      {
        name: "description",
        content: "Browse creator IP. Buy from open listings or sell back to the pool.",
      },
      { property: "og:title", content: "IP Marketplace — Orisale" },
      {
        property: "og:description",
        content: "Buy creator IP from holders or accept the protocol buyback.",
      },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <AppShell title="Marketplace" subtitle="Open listings from holders">
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-foreground">
          Each IP has an open order book. Floor price = lowest listing. Sell
          back instantly at the protocol buyback price.
        </p>
      </div>

      <div className="space-y-3">
        {IP_ASSETS.map((ip) => (
          <Link
            key={ip.id}
            to="/ip/$id"
            params={{ id: ip.id }}
            className="block overflow-hidden rounded-3xl bg-card shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <div className="flex gap-4 p-3">
              <img
                src={ip.cover}
                alt=""
                loading="lazy"
                className="h-24 w-24 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{ip.category}</p>
                    <h3 className="truncate font-bold">{ip.title}</h3>
                    <p className="text-xs text-muted-foreground">by {ip.creator}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      ip.change24h >= 0
                        ? "bg-success/15 text-success-foreground"
                        : "bg-destructive/15 text-destructive",
                    )}
                  >
                    <TrendingUp
                      className={cn("inline h-3 w-3", ip.change24h < 0 && "rotate-180")}
                    />{" "}
                    {ip.change24h >= 0 ? "+" : ""}
                    {ip.change24h}%
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Floor
                    </p>
                    <p className="text-lg font-bold">${ip.pricePerShare}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${ip.monthlyRevenue.toLocaleString()}/mo revenue
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
