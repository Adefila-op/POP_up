import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShoppingBag,
  MoreHorizontal,
  FileText,
  ImageIcon,
  Wrench,
  Check,
  X,
  Send,
  Copy,
  Link2,
  Twitter,
  Facebook,
  Mail,
  Flag,
  EyeOff,
  UserPlus,
  UserCheck,
  Download,
  Eye,
  CornerDownRight,
  Smile,
  ArrowDownAZ,
  Clock,
  Pin,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContentOpener } from "@/components/ContentOpener";
import { CONTENT, creatorSlug, type ContentItem } from "@/lib/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Orisale" },
      {
        name: "description",
        content:
          "Scroll a feed of creator drops. Like, share, save, and buy digital content in one tap.",
      },
      { property: "og:title", content: "Discover — Orisale" },
      {
        property: "og:description",
        content: "An Instagram-style feed for creator drops on Orisale.",
      },
    ],
  }),
  component: DiscoverPage,
});

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  pinned?: boolean;
  isCreator?: boolean;
  parentId?: string;
}

type FeedItem = ContentItem & {
  likes: number;
  caption: string;
  tags: string[];
  comments: Comment[];
};

const NOW = Date.now();
const seedComments = (id: string, creator: string): Comment[] => [
  {
    id: `${id}-c1`,
    user: creator,
    avatar: creator.slice(0, 2).toUpperCase(),
    text: "Thanks everyone — drop your questions below 💙",
    createdAt: NOW - 1000 * 60 * 60 * 2,
    likes: 56,
    pinned: true,
    isCreator: true,
  },
  {
    id: `${id}-c2`,
    user: "ada.codes",
    avatar: "AC",
    text: "Day 1 buy — this is incredible 🔥",
    createdAt: NOW - 1000 * 60 * 12,
    likes: 24,
  },
  {
    id: `${id}-c3`,
    user: "maya.draws",
    avatar: "MD",
    text: "Auto-purchase, no questions asked.",
    createdAt: NOW - 1000 * 60 * 34,
    likes: 8,
  },
  {
    id: `${id}-c4`,
    user: "leo.builds",
    avatar: "LB",
    text: "How long did this take to make?",
    createdAt: NOW - 1000 * 60 * 60,
    likes: 3,
  },
];

const buildFeed = (): FeedItem[] =>
  CONTENT.map((item, i) => ({
    ...item,
    likes: 1240 + i * 317,
    caption:
      i % 2 === 0
        ? "Just dropped ✨ Tap the bag to grab it — limited launch price."
        : "New release for the community 💙 Save it for later or buy now.",
    tags:
      item.type === "pdf"
        ? ["#playbook", "#creators"]
        : item.type === "art"
          ? ["#digitalart", "#wallpaper"]
          : ["#tools", "#productivity"],
    comments: seedComments(item.id, item.creator),
  }));

function DiscoverPage() {
  const [feed, setFeed] = useState<FeedItem[]>(() => buildFeed());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [bought, setBought] = useState<Set<string>>(new Set());

  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [activeShare, setActiveShare] = useState<FeedItem | null>(null);
  const [activeMore, setActiveMore] = useState<FeedItem | null>(null);
  const [activeBuy, setActiveBuy] = useState<FeedItem | null>(null);
  const [openItem, setOpenItem] = useState<FeedItem | null>(null);

  const visible = feed.filter((p) => !hidden.has(p.id));
  const commentPost = feed.find((p) => p.id === activeComments) ?? null;

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from saved");
      } else {
        next.add(id);
        toast.success("Saved to your collection");
      }
      return next;
    });
  };

  const toggleFollow = (creator: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(creator)) {
        next.delete(creator);
        toast(`Unfollowed ${creator}`);
      } else {
        next.add(creator);
        toast.success(`Following ${creator}`);
      }
      return next;
    });
  };

  const hidePost = (id: string) => {
    setHidden((prev) => new Set(prev).add(id));
    toast("Post hidden");
    setActiveMore(null);
  };

  const confirmBuy = (post: FeedItem) => {
    setBought((prev) => new Set(prev).add(post.id));
    toast.success(
      post.price === 0
        ? "Added to your library"
        : `Purchased ${post.title} for $${post.price}`,
      {
        description: post.type === "tool" ? "Ready to download" : "Ready to view",
        action: {
          label: post.type === "tool" ? "Download" : "View",
          onClick: () => toast.success(post.type === "tool" ? "Downloading…" : "Opening viewer…"),
        },
      },
    );
    setActiveBuy(null);
  };

  const addComment = (postId: string, text: string, parentId?: string) => {
    const c: Comment = {
      id: `${postId}-u-${Date.now()}`,
      user: "you",
      avatar: "YO",
      text,
      createdAt: Date.now(),
      likes: 0,
      parentId,
    };
    setFeed((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, c] } : p)),
    );
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    setFeed((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId
                  ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
                  : c,
              ),
            }
          : p,
      ),
    );
  };

  return (
    <AppShell title="Discover" subtitle="Fresh drops from creators">
      {/* Stories rail */}
      <div className="-mx-5 mb-4 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {feed.slice(0, 8).map((p) => {
          const isFollowing = following.has(p.creator);
          return (
            <button
              key={`story-${p.id}`}
              onClick={() => toggleFollow(p.creator)}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full p-[2px]",
                  isFollowing
                    ? "bg-muted"
                    : "bg-gradient-to-tr from-warning via-destructive to-primary",
                )}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-background p-[2px]">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-warning text-xs font-bold text-primary-foreground">
                    {p.creatorAvatar}
                  </span>
                </span>
              </span>
              <span className="w-full truncate text-[10px] text-muted-foreground">
                {p.creator.split(" ")[0].toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="-mx-5 space-y-6">
        {visible.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            liked={liked.has(post.id)}
            saved={saved.has(post.id)}
            bought={bought.has(post.id)}
            following={following.has(post.creator)}
            onLike={() => toggleLike(post.id)}
            onSave={() => toggleSave(post.id)}
            onFollow={() => toggleFollow(post.creator)}
            onOpenComments={() => setActiveComments(post.id)}
            onOpenShare={() => setActiveShare(post)}
            onOpenMore={() => setActiveMore(post)}
            onBuy={() => setActiveBuy(post)}
            onOpen={() => setOpenItem(post)}
          />
        ))}
        {visible.length === 0 && (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            <p>You've caught up. Pull down to refresh.</p>
            <button
              onClick={() => setHidden(new Set())}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Restore hidden posts
            </button>
          </div>
        )}
      </div>

      {/* Sheets */}
      {commentPost && (
        <CommentsSheet
          post={commentPost}
          onClose={() => setActiveComments(null)}
          onSubmit={(t, parentId) => addComment(commentPost.id, t, parentId)}
          onLike={(cid) => toggleCommentLike(commentPost.id, cid)}
        />
      )}
      {activeShare && (
        <ShareSheet post={activeShare} onClose={() => setActiveShare(null)} />
      )}
      {activeMore && (
        <MoreSheet
          post={activeMore}
          following={following.has(activeMore.creator)}
          onClose={() => setActiveMore(null)}
          onFollow={() => {
            toggleFollow(activeMore.creator);
            setActiveMore(null);
          }}
          onHide={() => hidePost(activeMore.id)}
          onCopy={() => {
            copyLink(activeMore.id);
            setActiveMore(null);
          }}
        />
      )}
      {activeBuy && (
        <BuySheet
          post={activeBuy}
          onClose={() => setActiveBuy(null)}
          onConfirm={() => {
            confirmBuy(activeBuy);
            setOpenItem(activeBuy);
          }}
        />
      )}
      {openItem && (
        <ContentOpener item={openItem} onClose={() => setOpenItem(null)} />
      )}
    </AppShell>
  );
}

const buildShareUrl = (postId: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/content/${postId}`;

const copyLink = async (postId: string) => {
  const url = buildShareUrl(postId);
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Could not copy link");
  }
};

function FeedPost({
  post,
  liked,
  saved,
  bought,
  following,
  onLike,
  onSave,
  onFollow,
  onOpenComments,
  onOpenShare,
  onOpenMore,
  onBuy,
  onOpen,
}: {
  post: FeedItem;
  liked: boolean;
  saved: boolean;
  bought: boolean;
  following: boolean;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
  onOpenMore: () => void;
  onBuy: () => void;
  onOpen: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const lastTap = useRef(0);

  const likeCount = post.likes + (liked ? 1 : 0);

  const triggerHeart = () => {
    setShowHeart(true);
    window.setTimeout(() => setShowHeart(false), 700);
  };

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!liked) onLike();
      triggerHeart();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const handleHeartClick = () => {
    if (!liked) triggerHeart();
    onLike();
  };

  return (
    <article className="bg-card">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3">
        <Link
          to="/creator/$slug"
          params={{ slug: creatorSlug(post.creator) }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-warning text-xs font-bold text-primary-foreground"
        >
          {post.creatorAvatar}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              to="/creator/$slug"
              params={{ slug: creatorSlug(post.creator) }}
              className="truncate text-sm font-semibold hover:text-primary"
            >
              {post.creator}
            </Link>
            <button
              onClick={onFollow}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                following
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {following ? (
                <span className="inline-flex items-center gap-0.5">
                  <UserCheck className="h-2.5 w-2.5" /> Following
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <UserPlus className="h-2.5 w-2.5" /> Follow
                </span>
              )}
            </button>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{post.category}</p>
        </div>
        <TypePill type={post.type} />
        <button
          onClick={onOpenMore}
          aria-label="More"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {/* Media */}
      <div
        onClick={handleMediaTap}
        className="relative aspect-square overflow-hidden bg-muted select-none"
      >
        <img
          src={post.cover}
          alt={post.title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />

        {/* Double-tap heart */}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart
              className="h-28 w-28 animate-[ping_0.7s_ease-out] fill-white text-white drop-shadow-2xl"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* View link */}
        <Link
          to="/content/$id"
          params={{ id: post.id }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur"
        >
          <Eye className="h-3 w-3" /> Details
        </Link>

        {/* Buy chip */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (bought) {
              onOpen();
              return;
            }
            onBuy();
          }}
          className={cn(
            "absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-pop backdrop-blur transition-transform active:scale-95",
            bought
              ? "bg-primary text-primary-foreground hover:scale-105"
              : "bg-ink/90 text-ink-foreground hover:scale-105",
          )}
        >
          {bought ? (
            <>
              {post.type === "tool" && (
                <>
                  <Download className="h-3.5 w-3.5" /> Download
                </>
              )}
              {post.type === "pdf" && (
                <>
                  <FileText className="h-3.5 w-3.5" /> Read
                </>
              )}
              {post.type === "art" && (
                <>
                  <Eye className="h-3.5 w-3.5" /> View
                </>
              )}
            </>
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5" />
              {post.price === 0 ? "Get free" : `Buy $${post.price}`}
            </>
          )}
        </button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-2">
        <ActionButton
          onClick={handleHeartClick}
          active={liked}
          activeClass="text-destructive"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={cn("h-6 w-6", liked && "fill-destructive")} />
        </ActionButton>
        <ActionButton onClick={onOpenComments} aria-label="Comments">
          <MessageCircle className="h-6 w-6" />
        </ActionButton>
        <ActionButton onClick={onOpenShare} aria-label="Share">
          <Share2 className="h-6 w-6" />
        </ActionButton>
        <div className="ml-auto" />
        <ActionButton
          onClick={onSave}
          active={saved}
          activeClass="text-primary"
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("h-6 w-6", saved && "fill-primary")} />
        </ActionButton>
      </div>

      {/* Meta */}
      <div className="space-y-1 px-5 pb-4">
        <p className="text-sm font-semibold">{likeCount.toLocaleString()} likes</p>
        <p
          className={cn(
            "text-sm leading-snug",
            !captionOpen && "line-clamp-2",
          )}
        >
          <span className="font-semibold">{post.creator}</span>{" "}
          <span className="font-semibold">{post.title}</span>
          <span className="text-foreground/80"> — {post.caption}</span>
        </p>
        {!captionOpen && post.caption.length > 60 && (
          <button
            onClick={() => setCaptionOpen(true)}
            className="text-xs text-muted-foreground"
          >
            more
          </button>
        )}
        <p className="text-xs text-primary">{post.tags.join(" ")}</p>
        <button
          onClick={onOpenComments}
          className="pt-1 text-xs text-muted-foreground"
        >
          View all {post.comments.length} comments
        </button>
      </div>
    </article>
  );
}

function ActionButton({
  children,
  onClick,
  active,
  activeClass,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90",
        active ? activeClass : "text-foreground hover:text-primary",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function TypePill({ type }: { type: ContentItem["type"] }) {
  const map = {
    pdf: { Icon: FileText, label: "PDF", cls: "bg-warning/20 text-warning-foreground" },
    art: { Icon: ImageIcon, label: "Art", cls: "bg-primary-soft text-primary" },
    tool: { Icon: Wrench, label: "Tool", cls: "bg-success/20 text-success-foreground" },
  } as const;
  const { Icon, label, cls } = map[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/* ---------------- Sheets ---------------- */

function Sheet({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card shadow-pop animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="mx-auto h-1 w-10 rounded-full bg-muted" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <h3 className="font-bold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "🤯", "💸", "👀", "🙌", "😂"];

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function CommentsSheet({
  post,
  onClose,
  onSubmit,
  onLike,
}: {
  post: FeedItem;
  onClose: () => void;
  onSubmit: (text: string, parentId?: string) => void;
  onLike: (commentId: string) => void;
}) {
  const [text, setText] = useState("");
  const [sort, setSort] = useState<"top" | "new">("top");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Group comments into threads
  const { threads, count } = useMemo(() => {
    const roots = post.comments.filter((c) => !c.parentId);
    const replies = post.comments.filter((c) => c.parentId);
    const sorted = [...roots].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (b.pinned && !a.pinned) return 1;
      return sort === "top"
        ? b.likes - a.likes
        : b.createdAt - a.createdAt;
    });
    const threadList = sorted.map((root) => ({
      root,
      replies: replies
        .filter((r) => r.parentId === root.id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));
    return { threads: threadList, count: post.comments.length };
  }, [post.comments, sort]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSubmit(t, replyTo?.id);
    setText("");
    setReplyTo(null);
    toast.success(replyTo ? "Reply posted" : "Comment posted");
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startReply = (c: Comment) => {
    setReplyTo(c);
    setOpenThreads((prev) => new Set(prev).add(c.id));
    inputRef.current?.focus();
  };

  return (
    <Sheet onClose={onClose}>
      {/* Custom header with sort */}
      <div className="flex items-center justify-between px-5 pb-2 pt-3">
        <div>
          <h3 className="font-bold">Comments</h3>
          <p className="text-[11px] text-muted-foreground">
            {count} {count === 1 ? "comment" : "comments"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSort(sort === "top" ? "new" : "top")}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold"
          >
            {sort === "top" ? (
              <>
                <ArrowDownAZ className="h-3 w-3" /> Top
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" /> Newest
              </>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[55vh] space-y-4 overflow-y-auto px-5 pb-4">
        {threads.map(({ root, replies }) => (
          <div key={root.id}>
            <CommentRow
              c={root}
              onLike={() => onLike(root.id)}
              onReply={() => startReply(root)}
            />
            {replies.length > 0 && (
              <div className="ml-12 mt-2 space-y-3 border-l-2 border-border/60 pl-3">
                {!openThreads.has(root.id) ? (
                  <button
                    onClick={() =>
                      setOpenThreads((prev) => new Set(prev).add(root.id))
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    View {replies.length}{" "}
                    {replies.length === 1 ? "reply" : "replies"}
                  </button>
                ) : (
                  <>
                    {replies.map((r) => (
                      <CommentRow
                        key={r.id}
                        c={r}
                        compact
                        onLike={() => onLike(r.id)}
                        onReply={() => startReply(root)}
                      />
                    ))}
                    <button
                      onClick={() =>
                        setOpenThreads((prev) => {
                          const next = new Set(prev);
                          next.delete(root.id);
                          return next;
                        })
                      }
                      className="text-[11px] font-semibold text-muted-foreground"
                    >
                      Hide replies
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {count === 0 && (
          <div className="py-10 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-semibold">No comments yet</p>
            <p className="text-xs text-muted-foreground">
              Be the first to share what you think.
            </p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-card pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {/* Quick emoji rail */}
        <div className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => insertEmoji(e)}
              className="shrink-0 rounded-full px-2 py-1 text-lg leading-none transition-transform active:scale-110 hover:bg-secondary"
            >
              {e}
            </button>
          ))}
        </div>

        {replyTo && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-primary-soft px-3 py-1.5 text-[11px] text-primary">
            <span className="truncate">
              Replying to <span className="font-semibold">@{replyTo.user}</span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="ml-2 shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form
          onSubmit={submit}
          className="flex items-end gap-2 px-4 pb-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            YO
          </div>
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              maxLength={500}
              rows={1}
              placeholder={replyTo ? `Reply to @${replyTo.user}…` : "Add a comment…"}
              className="block max-h-28 w-full resize-none rounded-2xl bg-secondary px-4 py-2 pr-10 text-sm focus:outline-none"
              style={{ minHeight: 36 }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 112)}px`;
              }}
            />
            {text.length > 0 && (
              <span className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                {text.length}/500
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => insertEmoji("😊")}
            aria-label="Emoji"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform disabled:opacity-40 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Sheet>
  );
}

function CommentRow({
  c,
  compact,
  onLike,
  onReply,
}: {
  c: Comment;
  compact?: boolean;
  onLike: () => void;
  onReply: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Link
        to="/creator/$slug"
        params={{ slug: creatorSlug(c.user) }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-warning text-[11px] font-bold text-primary-foreground",
          compact ? "h-7 w-7 text-[10px]" : "h-9 w-9",
        )}
      >
        {c.avatar}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link
            to="/creator/$slug"
            params={{ slug: creatorSlug(c.user) }}
            className="font-semibold hover:text-primary"
          >
            {c.user}
          </Link>
          {c.isCreator && (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 align-middle text-[9px] font-bold text-primary-foreground">
              Creator
            </span>
          )}{" "}
          <span className="text-foreground/85">{c.text}</span>
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{timeAgo(c.createdAt)}</span>
          {c.likes > 0 && (
            <span>
              {c.likes} {c.likes === 1 ? "like" : "likes"}
            </span>
          )}
          <button
            onClick={onReply}
            className="font-semibold hover:text-foreground"
          >
            Reply
          </button>
          {c.pinned && (
            <span className="inline-flex items-center gap-0.5 text-primary">
              <Pin className="h-2.5 w-2.5" /> Pinned
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onLike}
        aria-label="Like comment"
        className="p-1 text-muted-foreground transition-transform active:scale-125"
      >
        <Heart
          className={cn(
            "h-3.5 w-3.5",
            c.liked && "fill-destructive text-destructive",
          )}
        />
      </button>
    </div>
  );
}

function ShareSheet({ post, onClose }: { post: FeedItem; onClose: () => void }) {
  const url = buildShareUrl(post.id);
  const text = `Check out "${post.title}" by ${post.creator} on Orisale`;

  const targets = [
    {
      label: "Native",
      Icon: Share2,
      cls: "bg-ink text-ink-foreground",
      action: async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
          try {
            await navigator.share({ title: post.title, text, url });
            return;
          } catch {
            return;
          }
        }
        toast("Native share unavailable on this device");
      },
    },
    {
      label: "Copy link",
      Icon: Copy,
      cls: "bg-secondary text-foreground",
      action: () => copyLink(post.id),
    },
    {
      label: "Twitter",
      Icon: Twitter,
      cls: "bg-primary text-primary-foreground",
      action: () => {
        const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(u, "_blank", "noopener");
      },
    },
    {
      label: "Facebook",
      Icon: Facebook,
      cls: "bg-primary text-primary-foreground",
      action: () => {
        const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(u, "_blank", "noopener");
      },
    },
    {
      label: "Email",
      Icon: Mail,
      cls: "bg-warning text-warning-foreground",
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
      },
    },
    {
      label: "Embed",
      Icon: Link2,
      cls: "bg-secondary text-foreground",
      action: () => {
        const embed = `<iframe src="${url}" width="100%" height="600"></iframe>`;
        navigator.clipboard.writeText(embed).then(
          () => toast.success("Embed code copied"),
          () => toast.error("Could not copy embed"),
        );
      },
    },
  ];

  return (
    <Sheet title="Share post" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 px-5 pb-6">
        {targets.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              t.action();
              onClose();
            }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-background p-3 text-xs font-semibold transition-transform active:scale-95"
          >
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                t.cls,
              )}
            >
              <t.Icon className="h-5 w-5" />
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function MoreSheet({
  post,
  following,
  onClose,
  onFollow,
  onHide,
  onCopy,
}: {
  post: FeedItem;
  following: boolean;
  onClose: () => void;
  onFollow: () => void;
  onHide: () => void;
  onCopy: () => void;
}) {
  const items = [
    {
      label: following ? `Unfollow ${post.creator}` : `Follow ${post.creator}`,
      Icon: following ? UserCheck : UserPlus,
      action: onFollow,
    },
    { label: "Copy link", Icon: Copy, action: onCopy },
    { label: "Hide post", Icon: EyeOff, action: onHide },
    {
      label: "Report",
      Icon: Flag,
      destructive: true,
      action: () => {
        toast.success("Report submitted");
        onClose();
      },
    },
  ];

  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-2">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={it.action}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-secondary",
              it.destructive && "text-destructive",
            )}
          >
            <it.Icon className="h-4 w-4" />
            {it.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

function BuySheet({
  post,
  onClose,
  onConfirm,
}: {
  post: FeedItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const fee = +(post.price * 0.05).toFixed(2);
  const total = +(post.price + fee).toFixed(2);
  return (
    <Sheet title={post.price === 0 ? "Get for free" : "Confirm purchase"} onClose={onClose}>
      <div className="px-5 pb-6">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <img
            src={post.cover}
            alt=""
            className="h-14 w-14 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{post.title}</p>
            <p className="text-xs text-muted-foreground">by {post.creator}</p>
          </div>
          <p className="text-base font-bold">
            {post.price === 0 ? "Free" : `$${post.price}`}
          </p>
        </div>

        {post.price > 0 && (
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Item</span>
              <span>${post.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service fee</span>
              <span>${fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="mt-5 w-full rounded-full bg-ink py-3 font-semibold text-ink-foreground shadow-ink transition-transform active:scale-[0.98]"
        >
          {post.price === 0 ? "Add to library" : `Pay $${total.toFixed(2)}`}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
