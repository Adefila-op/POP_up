import { Outlet, Link, createRootRoute, HeadContent } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppStateProvider } from "@/lib/app-state";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Popup" },
      { name: "description", content: "Popup - Creator Commerce Platform" },
      { name: "theme-color", content: "#a78bfa" },
      { property: "og:title", content: "Popup" },
      { property: "og:description", content: "Popup - Creator Commerce Platform" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Popup" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <AppStateProvider>
      <HeadContent />
      <Outlet />
      <Toaster position="top-center" />
    </AppStateProvider>
  );
}
