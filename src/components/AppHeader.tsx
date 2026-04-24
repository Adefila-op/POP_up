import { Link } from "@tanstack/react-router";
import { Search, Bell } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title = "Orisale", subtitle }: AppHeaderProps) {
  return (
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-warning" />
          </button>
        </div>
      </div>
    </header>
  );
}
