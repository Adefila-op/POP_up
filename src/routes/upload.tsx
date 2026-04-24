import { useState } from "react";
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
  const [type, setType] = useState<ContentType>("pdf");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("19");
  const [desc, setDesc] = useState("");
  const [tokenize, setTokenize] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please add a title");
      return;
    }
    toast.success("Listing created!", {
      description: tokenize ? "Also listed for IP fractionalization." : "Live in your store.",
    });
    setTimeout(() => navigate({ to: "/store" }), 800);
  };

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
                +20 sales
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">$180K</p>
            <p className="text-xs text-muted-foreground">Earnings</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-soft">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Package className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                +205 IP
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">20K</p>
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
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card py-10 text-center transition-colors hover:border-primary">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">
              {type === "pdf" && "Drop your PDF here"}
              {type === "art" && "Drop your artwork (PNG, JPG, SVG)"}
              {type === "tool" && "Drop your tool package (.zip, .dmg, .exe)"}
            </p>
            <p className="text-xs text-muted-foreground">Up to 500 MB</p>
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}
