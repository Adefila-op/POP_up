import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  FileText,
  ImageIcon,
  Wrench,
  Download,
  Eye,
  Check,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContentOpener } from "@/components/ContentOpener";
import { creatorSlug, getContent } from "@/lib/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/content/$id")({
  component: ContentDetailPage,
  notFoundComponent: () => (
    <AppShell title="Not found">
      <p className="py-20 text-center text-muted-foreground">Content not found.</p>
    </AppShell>
  ),
});

function ContentDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const item = getContent(id);
  const [purchased, setPurchased] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!item) {
    return (
      <AppShell title="Not found">
        <p className="py-20 text-center text-muted-foreground">Content not found.</p>
      </AppShell>
    );
  }

  const handlePurchase = () => {
    setPurchased(true);
    toast.success(item.price === 0 ? "Added to your library" : `Purchased for $${item.price}`);
  };

  const handleAction = () => {
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cover with back */}
      <div className="relative h-72 w-full overflow-hidden">
        <img src={item.cover} alt={item.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        <button
          onClick={() => navigate({ to: "/store" })}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <TypeBadge type={item.type} />
      </div>

      <div className="mx-auto -mt-10 max-w-md px-5">
        <div className="rounded-3xl bg-card p-6 shadow-pop">
          <p className="text-xs font-medium text-muted-foreground">{item.category}</p>
          <h1 className="mt-1 text-2xl font-bold text-balance">{item.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm">
            <Link
              to="/creator/$slug"
              params={{ slug: creatorSlug(item.creator) }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {item.creatorAvatar}
            </Link>
            <Link
              to="/creator/$slug"
              params={{ slug: creatorSlug(item.creator) }}
              className="font-medium hover:text-primary"
            >
              {item.creator}
            </Link>
            <span className="ml-auto flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {item.rating} · {item.sales.toLocaleString()} sales
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

          {/* Type-specific specs */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {item.type === "pdf" && (
              <>
                <Spec label="Pages" value={`${item.pages}`} />
                <Spec label="Format" value="PDF" />
              </>
            )}
            {item.type === "art" && (
              <>
                <Spec label="Style" value={item.artStyle ?? "Mixed"} />
                <Spec label="License" value="Commercial" />
              </>
            )}
            {item.type === "tool" && (
              <>
                <Spec label="Size" value={item.fileSize ?? "—"} />
                <Spec label="Platform" value={item.platform ?? "—"} />
              </>
            )}
          </div>

          {/* Buy / Action */}
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-2xl font-bold">{item.price === 0 ? "Free" : `$${item.price}`}</p>
            </div>
            {!purchased ? (
              <button
                onClick={handlePurchase}
                className="ml-auto flex-1 rounded-full bg-ink py-3 font-semibold text-ink-foreground shadow-ink transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {item.price === 0 ? "Get Now" : "Buy Now"}
              </button>
            ) : (
              <button
                onClick={handleAction}
                className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {item.type === "tool" && (
                  <>
                    <Download className="h-4 w-4" /> Open & Download
                  </>
                )}
                {item.type === "pdf" && (
                  <>
                    <FileText className="h-4 w-4" /> Read now
                  </>
                )}
                {item.type === "art" && (
                  <>
                    <Eye className="h-4 w-4" /> View gallery
                  </>
                )}
              </button>
            )}
          </div>

          {purchased && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success-foreground">
              <Check className="h-3 w-3" /> In your library
            </p>
          )}
        </div>

        {/* Resell as IP teaser */}
        <Link
          to="/marketplace"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary-soft p-4 text-sm"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold text-primary">Own creator IP like this</p>
            <p className="text-xs text-muted-foreground">
              Buy shares, resell, or stake into liquidity pools.
            </p>
          </div>
        </Link>
      </div>

      {/* In-app opener */}
      {viewerOpen && (
        <ContentOpener item={item} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: "pdf" | "art" | "tool" }) {
  const map = {
    pdf: { Icon: FileText, label: "PDF", cls: "bg-warning text-warning-foreground" },
    art: { Icon: ImageIcon, label: "Digital Art", cls: "bg-primary text-primary-foreground" },
    tool: { Icon: Wrench, label: "Tool", cls: "bg-ink text-ink-foreground" },
  } as const;
  const { Icon, label, cls } = map[type];
  return (
    <span
      className={cn(
        "absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-soft",
        cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

