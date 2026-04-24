import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Bell } from "lucide-react";
import { CREATORS } from "@/lib/data";
import { useAppState } from "@/lib/use-app-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title = "Orisale", subtitle }: AppHeaderProps) {
  const { pushEnabled, setPushEnabled, contentCatalog, ipCatalog } = useAppState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return [
      ...contentCatalog
        .filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.creator.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q),
        )
        .map((item) => ({
          id: `content-${item.id}`,
          label: item.title,
          sublabel: `${item.creator} • ${item.category}`,
          to: `/content/${item.id}`,
        })),
      ...CREATORS.filter(
        (creator) =>
          creator.name.toLowerCase().includes(q) ||
          creator.slug.toLowerCase().includes(q) ||
          creator.location.toLowerCase().includes(q),
      ).map((creator) => ({
        id: `creator-${creator.slug}`,
        label: creator.name,
        sublabel: `@${creator.slug}`,
        to: `/creator/${creator.slug}`,
      })),
      ...ipCatalog
        .filter(
          (ip) =>
            ip.title.toLowerCase().includes(q) ||
            ip.creator.toLowerCase().includes(q) ||
            ip.category.toLowerCase().includes(q),
        )
        .map((ip) => ({
          id: `ip-${ip.id}`,
          label: ip.title,
          sublabel: `${ip.creator} • ${ip.category}`,
          to: `/ip/${ip.id}`,
        })),
    ].slice(0, 8);
  }, [contentCatalog, ipCatalog, query]);

  const updates = [
    {
      id: "u1",
      title: "New creator drop",
      body: "Lina Park just launched a new business PDF.",
    },
    {
      id: "u2",
      title: "IP price alert",
      body: "The Founder Letters is up 12.4% in the last 24 hours.",
    },
    {
      id: "u3",
      title: "Library update",
      body: "PromptForge Pro shipped a fresh desktop build.",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <div>
            <Link to="/" className="text-xl font-bold tracking-tight">
              {title}
            </Link>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-warning" />
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <OverlayShell title="Search" onClose={() => setSearchOpen(false)}>
          <div className="space-y-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, content, or IP"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
            />
            <div className="space-y-2">
              {query && results.length === 0 && (
                <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                  No results yet. Try a creator name, content title, or IP category.
                </p>
              )}
              {!query && (
                <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                  Try "Lina Park", "PromptForge", or "Newsletter".
                </p>
              )}
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={result.to}
                  onClick={() => setSearchOpen(false)}
                  className="block rounded-2xl bg-card px-4 py-3 shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  <p className="text-sm font-semibold">{result.label}</p>
                  <p className="text-xs text-muted-foreground">{result.sublabel}</p>
                </Link>
              ))}
            </div>
          </div>
        </OverlayShell>
      )}

      {notificationsOpen && (
        <OverlayShell title="Notifications" onClose={() => setNotificationsOpen(false)}>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                const next = !pushEnabled;
                setPushEnabled(next);
                toast.success(next ? "Push updates enabled" : "Push updates paused");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                pushEnabled ? "border-primary bg-primary-soft" : "border-border bg-card",
              )}
            >
              <div>
                <p className="text-sm font-semibold">Push updates</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when creators post new drops and product updates.
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  pushEnabled ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {pushEnabled ? "On" : "Off"}
              </span>
            </button>

            <div className="space-y-2">
              {updates.map((update) => (
                <div key={update.id} className="rounded-2xl bg-card px-4 py-3 shadow-soft">
                  <p className="text-sm font-semibold">{update.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {update.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </OverlayShell>
      )}
    </>
  );
}

function OverlayShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
