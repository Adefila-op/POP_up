import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Upload,
  FileText,
  Image as ImageIcon,
  Wrench,
  Check,
  TrendingUp,
  Package,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/lib/data";
import { useAppState } from "@/lib/use-app-state";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Orisale" },
      { name: "description", content: "Upload PDFs, art and tools to sell on Orisale." },
    ],
  }),
  component: UploadPage,
});

const types: { id: ContentType; label: string; icon: typeof FileText; cls: string }[] = [
  { id: "pdf", label: "PDF", icon: FileText, cls: "bg-warning/20 text-warning-foreground" },
  { id: "art", label: "Digital Art", icon: ImageIcon, cls: "bg-primary-soft text-primary" },
  { id: "tool", label: "Tool", icon: Wrench, cls: "bg-success/20 text-success-foreground" },
];

function UploadPage() {
  const navigate = useNavigate();
  const {
    walletConnected,
    signedIn,
    creatorProfileActive,
    connectWallet,
    signIn,
    enableCreatorProfile,
    publishContent,
    createdContent,
    createdIpAssets,
    contentOrders,
    cashBalance,
  } = useAppState();
  const [type, setType] = useState<ContentType>("pdf");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("19");
  const [desc, setDesc] = useState("");
  const [tokenize, setTokenize] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileAccept = useMemo(
    () =>
      ({
        pdf: ".pdf,application/pdf",
        art: ".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml",
        tool: ".zip,.dmg,.exe,.msi,application/zip",
      })[type],
    [type],
  );

  const uploadHint =
    type === "pdf"
      ? "Upload a PDF buyers can instantly read after purchase."
      : type === "art"
        ? "Upload image or SVG assets buyers can preview in the gallery."
        : "Upload the installer or archive buyers can download.";

  const onPickFile = (selected: File | null) => {
    if (!selected) return;

    if (type === "pdf" && selected.type !== "application/pdf" && !selected.name.endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    setFile(selected);
    toast.success(`${selected.name} attached`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please add a title");
      return;
    }
    if (!file) {
      toast.error(type === "pdf" ? "Please upload a PDF file." : "Please upload a file.");
      return;
    }

    try {
      const result = await publishContent({
        type,
        title,
        description: desc || `New ${type} release by demo creator.`,
        price: Number(price) || 0,
        tokenize,
        fileName: file.name,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Listing created!", {
        description: tokenize
          ? `${file.name} uploaded and listed for IP fractionalization.`
          : `${file.name} is now live in your store.`,
      });
      setTimeout(() => navigate({ to: "/content/$id", params: { id: result.contentId } }), 800);
    } catch (error) {
      toast.error((error as Error).message || "Failed to publish");
    }
  };

  if (!walletConnected || !signedIn || !creatorProfileActive) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-bold">Creator access</h1>
            <span className="w-10" />
          </div>
        </header>

        <div className="mx-auto max-w-md space-y-5 px-5 pt-6">
          <div className="rounded-3xl bg-card p-6 shadow-pop">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Creator Console
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Connect a wallet and activate creator access
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Collectors only need a wallet. Publishing is reserved for creators who explicitly
              connect, sign in, and activate a creator profile.
            </p>

            <div className="mt-5 space-y-3">
              <AccessStep
                done={walletConnected}
                title="1. Connect wallet"
                body="Collectors can stop here. Creators continue to set up publishing access."
                actionLabel={walletConnected ? "Wallet connected" : "Connect wallet"}
                isLoading={isConnecting}
                onAction={async () => {
                  setIsConnecting(true);
                  try {
                    const result = await connectWallet();
                    if (result.ok) {
                      toast.success("Wallet connected");
                    } else {
                      toast.error(result.reason || "Failed to connect wallet");
                    }
                  } catch (error) {
                    toast.error((error as Error).message || "Wallet connection failed");
                  } finally {
                    setIsConnecting(false);
                  }
                }}
              />
              <AccessStep
                done={signedIn}
                title="2. Sign in as creator"
                body="This creates or restores your creator account. Collector wallets do not need this."
                actionLabel={signedIn ? "Creator signed in" : "Sign in as creator"}
                isLoading={isSigningIn}
                onAction={async () => {
                  setIsSigningIn(true);
                  try {
                    const result = await signIn();
                    if (result.ok) {
                      toast.success("Signed in successfully!");
                    } else {
                      toast.error(result.reason || "Failed to sign in");
                    }
                  } catch (error) {
                    toast.error((error as Error).message || "Sign in failed");
                  } finally {
                    setIsSigningIn(false);
                  }
                }}
              />
              <AccessStep
                done={creatorProfileActive}
                title="3. Activate creator profile"
                body="Only activated creator profiles can publish products and launch IP."
                actionLabel={creatorProfileActive ? "Creator profile active" : "Activate profile"}
                isLoading={isActivating}
                onAction={async () => {
                  if (!signedIn) {
                    toast.error("Sign in as creator first.");
                    return;
                  }
                  setIsActivating(true);
                  try {
                    const result = await enableCreatorProfile();
                    if (result.ok) {
                      toast.success("Creator profile activated");
                    } else {
                      toast.error(result.reason || "Failed to activate creator profile");
                    }
                  } catch (error) {
                    toast.error((error as Error).message || "Failed to activate creator profile");
                  } finally {
                    setIsActivating(false);
                  }
                }}
              />
            </div>

            <button
              type="button"
              disabled={!walletConnected || !signedIn || !creatorProfileActive}
              onClick={() => toast.success("Creator access unlocked")}
              className="mt-5 w-full rounded-full bg-ink py-3.5 font-semibold text-ink-foreground shadow-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {walletConnected && signedIn && creatorProfileActive
                ? "Access granted"
                : "Complete creator setup"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bold">New listing</h1>
          <span className="w-10" />
        </div>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-md space-y-5 px-5 pt-5">
        {/* Creator stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-3xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/30 text-warning-foreground">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {contentOrders.length} sales
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">${cashBalance.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Earnings</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-soft">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Package className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                {createdIpAssets.length} IP
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">{createdContent.length}</p>
            <p className="text-xs opacity-80">Items</p>
          </div>
        </section>

        {/* Type picker */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Content type</label>
          <div className="grid grid-cols-3 gap-3">
            {types.map((t) => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                    active
                      ? "border-primary bg-primary-soft"
                      : "border-transparent bg-card hover:border-border",
                  )}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${t.cls}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* File dropzone */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Upload file</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card py-10 text-center transition-colors hover:border-primary"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">
              {type === "pdf" && "Drop your PDF here"}
              {type === "art" && "Drop your artwork (PNG, JPG, SVG)"}
              {type === "tool" && "Drop your tool package (.zip, .dmg, .exe)"}
            </p>
            <p className="text-xs text-muted-foreground">{uploadHint}</p>
            <p className="text-xs text-muted-foreground">
              {file ? `Attached: ${file.name}` : "Tap to choose a file â€” up to 500 MB"}
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Indie Maker's Playbook"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Tell buyers what they'll get…"
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Price (USD)">
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg font-semibold focus:border-primary focus:outline-none"
          />
        </Field>

        {/* Tokenize toggle */}
        <button
          type="button"
          onClick={() => setTokenize((v) => !v)}
          className={cn(
            "flex w-full items-start gap-3 rounded-3xl border-2 p-4 text-left transition-all",
            tokenize ? "border-primary bg-primary-soft" : "border-border bg-card",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
              tokenize ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {tokenize && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <div>
            <p className="text-sm font-semibold">Also tokenize as creator IP</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Let fans buy fractional shares and stake into liquidity pools.
            </p>
          </div>
        </button>

        <button
          type="submit"
          className="w-full rounded-full bg-ink py-3.5 font-semibold text-ink-foreground shadow-ink transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Publish listing
        </button>
      </form>
    </div>
  );
}

function AccessStep({
  done,
  title,
  body,
  actionLabel,
  isLoading,
  onAction,
}: {
  done: boolean;
  title: string;
  body: string;
  actionLabel: string;
  isLoading?: boolean;
  onAction: () => Promise<void> | void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            done ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : title.split(".")[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={done || isLoading}
        className="mt-3 w-full rounded-full bg-secondary py-2 text-sm font-semibold disabled:opacity-60"
      >
        {isLoading ? "Loading..." : actionLabel}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}
