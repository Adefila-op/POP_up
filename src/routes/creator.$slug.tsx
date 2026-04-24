import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MapPin,
  Globe,
  CheckCircle2,
  Star,
  Grid3x3,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserCheck,
  Share2,
  Mail,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CREATORS, getCreator, getCreatorContent, getCreatorIp } from "@/lib/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/use-app-state";

export const Route = createFileRoute("/creator/$slug")({
  head: ({ params }) => {
    const c = getCreator(params.slug);
    const title = c ? `${c.name} — Creator on Orisale` : "Creator — Orisale";
    const description = c?.bio ?? "Creator profile on Orisale.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ];
    if (c?.cover) {
      meta.push({ property: "og:image", content: c.cover });
      meta.push({ property: "twitter:image", content: c.cover });
    }
    return { meta };
  },
  component: CreatorPage,
  notFoundComponent: () => (
    <AppShell title="Not found">
      <p className="py-20 text-center text-muted-foreground">Creator not found.</p>
    </AppShell>
  ),
});

function CreatorPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const creator = getCreator(slug);
  const [tab, setTab] = useState<"content" | "ip">("content");
  const [storyOpen, setStoryOpen] = useState(false);
  const { contentCatalog, ipCatalog, followedCreatorSlugs, toggleFollowCreator } = useAppState();

  if (!creator) {
    return (
      <AppShell title="Not found">
        <p className="py-20 text-center text-muted-foreground">Creator not found.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {CREATORS.slice(0, 4).map((c) => (
            <Link
              key={c.slug}
              to="/creator/$slug"
              params={{ slug: c.slug }}
              className="rounded-2xl bg-card p-3 text-sm shadow-soft"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </AppShell>
    );
  }

  const content = contentCatalog.filter((item) => item.creator === creator.name);
  const ips = ipCatalog.filter((ip) => ip.creator === creator.name);
  const following = followedCreatorSlugs.includes(slug);
  const followerCount = creator.followers + (following ? 1 : 0);

  const toggleFollow = () => {
    const next = toggleFollowCreator(slug);
    toast.success(next ? `Following ${creator.name}` : `Unfollowed ${creator.name}`);
  };

  const share = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/creator/${creator.slug}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: creator.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      // cancelled
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden">
        <img src={creator.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        <button
          onClick={() => navigate({ to: "/discover" })}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={share}
          aria-label="Share profile"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto -mt-12 max-w-md px-5">
        {/* Identity card */}
        <div className="rounded-3xl bg-card p-5 shadow-pop">
          <div className="flex items-end gap-4">
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              className="relative -mt-12 flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-primary to-warning text-lg font-bold text-primary-foreground shadow-soft"
              aria-label="Open creator story"
            >
              {creator.avatar}
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={toggleFollow}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition-transform active:scale-95",
                  following
                    ? "bg-secondary text-foreground"
                    : "bg-ink text-ink-foreground shadow-ink",
                )}
              >
                {following ? (
                  <>
                    <UserCheck className="h-3.5 w-3.5" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" /> Follow
                  </>
                )}
              </button>
              <button
                onClick={() => toast("Message sent to " + creator.name)}
                aria-label="Message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold">{creator.name}</h1>
              {creator.verified && (
                <CheckCircle2 className="h-4 w-4 fill-primary text-primary-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{creator.slug}</p>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{creator.bio}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {creator.location}
            </span>
            {creator.website && (
              <a
                href={`https://${creator.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary"
              >
                <Globe className="h-3 w-3" /> {creator.website}
              </a>
            )}
            <span>Joined {creator.joined}</span>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Followers" value={fmt(followerCount)} />
            <Stat label="Following" value={fmt(creator.following)} />
            <Stat label="Listings" value={`${content.length + ips.length}`} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 rounded-full bg-secondary p-1">
          <TabBtn active={tab === "content"} onClick={() => setTab("content")}>
            <Grid3x3 className="h-3.5 w-3.5" /> Content ({content.length})
          </TabBtn>
          <TabBtn active={tab === "ip"} onClick={() => setTab("ip")}>
            <Sparkles className="h-3.5 w-3.5" /> IP ({ips.length})
          </TabBtn>
        </div>

        {/* Content tab */}
        {tab === "content" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {content.map((item) => (
              <Link
                key={item.id}
                to="/content/$id"
                params={{ id: item.id }}
                className="group overflow-hidden rounded-2xl bg-card shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-bold">
                      {item.price === 0 ? "Free" : `$${item.price}`}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {item.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {content.length === 0 && (
              <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                No content yet.
              </p>
            )}
          </div>
        )}

        {/* IP tab */}
        {tab === "ip" && (
          <div className="mt-4 space-y-3">
            {ips.map((ip) => (
              <Link
                key={ip.id}
                to="/ip/$id"
                params={{ id: ip.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
              >
                <img src={ip.cover} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{ip.title}</p>
                  <p className="text-xs text-muted-foreground">{ip.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${ip.pricePerShare}</p>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      ip.change24h >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    <TrendingUp
                      className={cn("inline h-3 w-3", ip.change24h < 0 && "rotate-180")}
                    />{" "}
                    {ip.change24h >= 0 ? "+" : ""}
                    {ip.change24h}%
                  </p>
                </div>
              </Link>
            ))}
            {ips.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No IP listings yet.</p>
            )}
          </div>
        )}
      </div>

      {storyOpen && (
        <CreatorPortfolioStory
          creator={creator}
          contentCount={content.length}
          ipCount={ips.length}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-3 py-2 text-center">
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all",
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

function CreatorPortfolioStory({
  creator,
  contentCount,
  ipCount,
  onClose,
}: {
  creator: NonNullable<ReturnType<typeof getCreator>>;
  contentCount: number;
  ipCount: number;
  onClose: () => void;
}) {
  const slides = useMemo(
    () => [
      {
        title: `${creator.name}'s creator story`,
        body: creator.bio,
      },
      {
        title: "Portfolio snapshot",
        body: `${contentCount} active content listings and ${ipCount} live IP positions in the demo portfolio.`,
      },
      {
        title: "Audience",
        body: `${fmt(creator.followers)} followers tracking this creator across drops, IP launches, and updates.`,
      },
    ],
    [contentCount, creator.bio, creator.followers, creator.name, ipCount],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= slides.length - 1) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 3200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <img src={creator.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/85" />

      <div className="relative mx-auto flex h-full max-w-md flex-col px-4 pb-8 pt-4">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-bold">
              {creator.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold">{creator.name}</p>
              <p className="text-xs text-white/70">@{creator.slug}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
            aria-label="Close creator story"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto rounded-[2rem] bg-black/35 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Story view
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">{slide.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{slide.body}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            <StoryStat label="Followers" value={fmt(creator.followers)} />
            <StoryStat label="Content" value={`${contentCount}`} />
            <StoryStat label="IP" value={`${ipCount}`} />
          </div>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev))}
            className="mt-5 w-full rounded-full bg-white py-3 text-sm font-semibold text-foreground"
          >
            {index < slides.length - 1 ? "Next story" : "Story finished"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-3">
      <p className="text-base font-bold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/65">{label}</p>
    </div>
  );
}
