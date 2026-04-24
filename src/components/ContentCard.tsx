import { Link } from "@tanstack/react-router";
import { FileText, Image as ImageIcon, Wrench, Star } from "lucide-react";
import type { ContentItem } from "@/lib/data";

const typeMeta: Record<ContentItem["type"], { label: string; icon: typeof FileText; cls: string }> =
  {
    pdf: { label: "PDF", icon: FileText, cls: "bg-warning/20 text-warning-foreground" },
    art: { label: "Art", icon: ImageIcon, cls: "bg-primary-soft text-primary" },
    tool: { label: "Tool", icon: Wrench, cls: "bg-success/20 text-success-foreground" },
  };

export function ContentCard({ item }: { item: ContentItem }) {
  const meta = typeMeta[item.type];
  const Icon = meta.icon;

  return (
    <Link
      to="/content/$id"
      params={{ id: item.id }}
      className="group block overflow-hidden rounded-3xl bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={item.cover}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
        >
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{item.creator}</p>
        <h3 className="line-clamp-1 font-semibold text-foreground">{item.title}</h3>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">
            {item.price === 0 ? "Free" : `$${item.price}`}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {item.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}
