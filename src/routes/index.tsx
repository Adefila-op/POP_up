import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, FileText, Wrench, ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContentCard } from "@/components/ContentCard";
import { CONTENT, IP_ASSETS } from "@/lib/data";
import heroCreator from "@/assets/hero-creator.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orisale — Sell digital content & creator IP" },
      {
        name: "description",
        content:
          "The complete creator app: sell PDFs, digital art, and tools. Buy creator IP, resell on the marketplace, or stake into liquidity pools.",
      },
      { property: "og:title", content: "Orisale — Sell digital content & creator IP" },
      { property: "og:description", content: "Sell digital content. Own creator IP. Earn." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = CONTENT.slice(0, 4);
  const trendingIp = IP_ASSETS.slice(0, 3);

  return (
    <AppShell title="Orisale" subtitle="Welcome back, creator 👋">
      {/* Hero */}
      <section className="relative mt-2 overflow-hidden rounded-3xl bg-hero-blue p-6 text-primary-foreground shadow-pop">
        <div className="relative z-10 max-w-[60%]">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">Welcome to</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-balance">
            The complete sales app for creators.
          </h1>
          <p className="mt-3 text-sm opacity-90">
            Sell content, own IP, earn from pools.
          </p>
          <Link
            to="/store"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground shadow-ink transition-transform hover:scale-105"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <img
          src={heroCreator}
          alt=""
          width={1024}
          height={1024}
          className="pointer-events-none absolute -bottom-4 -right-6 h-44 w-44 object-contain"
        />
        <div className="absolute right-6 top-6 h-16 w-16 rounded-2xl bg-white/15 blur-xl" />
      </section>

      {/* Quick categories */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Browse by type</h2>
        <div className="grid grid-cols-3 gap-3">
          <CategoryTile to="/store" label="PDFs" icon={<FileText className="h-5 w-5" />} tone="warning" />
          <CategoryTile to="/store" label="Art" icon={<ImageIcon className="h-5 w-5" />} tone="primary" />
          <CategoryTile to="/store" label="Tools" icon={<Wrench className="h-5 w-5" />} tone="success" />
        </div>
      </section>

      {/* Featured content */}
      <section className="mt-7">
        <SectionHeading title="Featured content" linkTo="/store" />
        <div className="grid grid-cols-2 gap-3">
          {featured.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Trending IP */}
      <section className="mt-8">
        <SectionHeading title="Trending creator IP" linkTo="/marketplace" />
        <div className="space-y-3">
          {trendingIp.map((ip) => (
            <Link
              key={ip.id}
              to="/ip/$id"
              params={{ id: ip.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <img
                src={ip.cover}
                alt=""
                loading="lazy"
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{ip.title}</p>
                <p className="text-xs text-muted-foreground">{ip.category} · {ip.creator}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${ip.pricePerShare}</p>
                <p
                  className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
                    ip.change24h >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  <TrendingUp className={`h-3 w-3 ${ip.change24h < 0 ? "rotate-180" : ""}`} />
                  {ip.change24h >= 0 ? "+" : ""}
                  {ip.change24h}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function CategoryTile({
  to,
  label,
  icon,
  tone,
}: {
  to: "/store";
  label: string;
  icon: React.ReactNode;
  tone: "warning" | "primary" | "success";
}) {
  const toneCls = {
    warning: "bg-warning/20 text-warning-foreground",
    primary: "bg-primary-soft text-primary",
    success: "bg-success/20 text-success-foreground",
  }[tone];
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-1"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${toneCls}`}>
        {icon}
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

function SectionHeading({ title, linkTo }: { title: string; linkTo: "/store" | "/marketplace" }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      <Link to={linkTo} className="text-xs font-semibold text-primary">
        See all →
      </Link>
    </div>
  );
}
