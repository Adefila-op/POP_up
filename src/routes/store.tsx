import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ContentCard } from "@/components/ContentCard";
import { CONTENT, type ContentType } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store — Orisale" },
      { name: "description", content: "Browse PDFs, digital art and tools from independent creators." },
      { property: "og:title", content: "Orisale Store" },
      { property: "og:description", content: "Discover digital content from independent creators." },
    ],
  }),
  component: StorePage,
});

const filters: { id: "all" | ContentType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDFs" },
  { id: "art", label: "Digital Art" },
  { id: "tool", label: "Tools" },
];

function StorePage() {
  const [active, setActive] = useState<"all" | ContentType>("all");
  const items = active === "all" ? CONTENT : CONTENT.filter((c) => c.type === active);

  return (
    <AppShell title="Store" subtitle="Buy & view digital content">
      <div className="-mx-5 mb-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active === f.id
                  ? "bg-ink text-ink-foreground shadow-ink"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No items match.</p>
      )}
    </AppShell>
  );
}
