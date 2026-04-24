import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function AppShell({ children, title, subtitle, hideHeader }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background bg-soft-grid pb-28">
      {!hideHeader && <AppHeader title={title} subtitle={subtitle} />}
      <main className="mx-auto max-w-md px-5 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
