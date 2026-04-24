import { useEffect } from "react";
import { ArrowLeft, Download, Check, FileText, Wrench } from "lucide-react";
import type { ContentItem } from "@/lib/data";
import { toast } from "sonner";

/**
 * In-app viewer / opener for owned content.
 * - PDF: paginated reader
 * - Art: gallery viewer
 * - Tool: download confirmation screen
 */
export function ContentOpener({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleDownload = () => {
    toast.success(`Downloading ${item.title}…`, {
      description: `${item.fileSize ?? ""} · ${item.platform ?? ""}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          aria-label="Close"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="truncate px-3 text-sm font-semibold">{item.title}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[10px] font-semibold text-success-foreground">
          <Check className="h-3 w-3" /> Owned
        </span>
      </header>

      <div className="flex-1 overflow-auto bg-muted">
        {item.type === "pdf" && <PdfReader item={item} />}
        {item.type === "art" && <ArtGallery item={item} />}
        {item.type === "tool" && (
          <ToolDownload item={item} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}

function PdfReader({ item }: { item: ContentItem }) {
  const totalPages = item.pages ?? 12;
  const pages = Math.min(totalPages, 6);
  return (
    <div className="mx-auto max-w-md space-y-4 p-5">
      <p className="text-center text-xs text-muted-foreground">
        Reading 1–{pages} of {totalPages}
      </p>
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-xl bg-card p-6 shadow-soft"
        >
          <p className="text-xs text-muted-foreground">
            Page {i + 1} of {totalPages}
          </p>
          <h3 className="mt-3 text-lg font-bold">
            {i === 0 ? item.title : `Chapter ${i}`}
          </h3>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((__, j) => (
              <div
                key={j}
                className="h-2 rounded-full bg-muted"
                style={{ width: `${55 + ((i + j) % 5) * 9}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtGallery({ item }: { item: ContentItem }) {
  return (
    <div className="mx-auto max-w-md space-y-4 p-5">
      {[item.cover, item.cover, item.cover].map((src, i) => (
        <figure key={i} className="overflow-hidden rounded-xl bg-card shadow-soft">
          <img
            src={src}
            alt={`${item.title} preview ${i + 1}`}
            className="w-full object-cover"
          />
          <figcaption className="px-4 py-3 text-xs text-muted-foreground">
            {item.title} — {item.artStyle ?? "Artwork"} #{i + 1}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function ToolDownload({
  item,
  onDownload,
}: {
  item: ContentItem;
  onDownload: () => void;
}) {
  return (
    <div className="mx-auto max-w-sm space-y-5 p-6 pt-12 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-pop">
        <Wrench className="h-9 w-9" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{item.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        <Spec label="File size" value={item.fileSize ?? "—"} />
        <Spec label="Platform" value={item.platform ?? "—"} />
      </div>
      <button
        onClick={onDownload}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-ink-foreground shadow-ink transition-transform active:scale-[0.98]"
      >
        <Download className="h-4 w-4" />
        Download installer
      </button>
      <p className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3 w-3" /> License keys are in your library
      </p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-soft">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
