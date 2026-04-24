import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Wallet, Coins, Library } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CONTENT, IP_ASSETS } from "@/lib/data";

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
  // Mock holdings
  const library = CONTENT.slice(0, 3);
  const holdings = [
    { ip: IP_ASSETS[0], shares: 50 },
    { ip: IP_ASSETS[2], shares: 12 },
  ];

  const totalIp = holdings.reduce((s, h) => s + h.shares * h.ip.pricePerShare, 0);

  return (
    <AppShell title="Portfolio" subtitle="Your library, IP & pools">
      {/* Wallet card */}
      <section className="rounded-3xl bg-ink p-6 text-ink-foreground shadow-ink">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Total balance</p>
            <p className="mt-1 text-3xl font-bold">${(totalIp + 245).toFixed(2)}</p>
          </div>
          <Wallet className="h-6 w-6 opacity-60" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <Mini label="Cash" value="$245" />
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
