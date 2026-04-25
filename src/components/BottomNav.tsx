import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Sparkles, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/marketplace", label: "IP", icon: Sparkles },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md items-end justify-between px-6 pt-2">
        {items.slice(0, 2).map((item) => (
          <NavLink key={item.to} item={item} active={pathname === item.to} />
        ))}

        <Link
          to="/upload"
          aria-label="Upload"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-ink-foreground shadow-ink transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>

        {items.slice(2).map((item) => (
          <NavLink key={item.to} item={item} active={pathname.startsWith(item.to)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { to: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex w-16 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "fill-primary/15")} strokeWidth={active ? 2.5 : 2} />
      <span>{item.label}</span>
    </Link>
  );
}
