import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Zap, DollarSign, Calendar } from "lucide-react";
import { useAppState } from "@/lib/use-app-state";
import { toast } from "sonner";

interface IPLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IPLaunchModal({ open, onOpenChange }: IPLaunchModalProps) {
  const { publishContent } = useAppState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [initialLiquidity, setInitialLiquidity] = useState("10000");
  const [launchDays, setLaunchDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "liquidity" | "review">("details");

  const liquidityAmount = parseFloat(initialLiquidity) || 0;
  const forfeit30Percent = liquidityAmount * 0.3;
  const creatorKeeps70Percent = liquidityAmount * 0.7;
  const initialTokens = creatorKeeps70Percent / 1; // $1 initial price

  const handleLaunch = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (liquidityAmount < 1000) {
      toast.error("Minimum liquidity is $1,000");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = publishContent({
        type: "pdf",
        title,
        description,
        price: 0,
        tokenize: true,
        fileName: `ip_${title.replace(/\s+/g, "_")}`,
      });

      toast.success(`IP "${title}" launched successfully!`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to launch IP");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setInitialLiquidity("10000");
    setLaunchDays("30");
    setStep("details");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Launch IP Asset
          </DialogTitle>
          <DialogDescription>
            Create and launch your intellectual property as a tradable token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex gap-2">
            {(["details", "liquidity", "review"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                  step === s
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "details" && "Details"}
                {s === "liquidity" && "Liquidity"}
                {s === "review" && "Review"}
              </button>
            ))}
          </div>

          {/* Details Step */}
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">IP Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI Art Collection Vol. 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your IP asset, what it includes, and why people should invest..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="launchDays">Launch Duration (Days)</Label>
                <Input
                  id="launchDays"
                  type="number"
                  value={launchDays}
                  onChange={(e) => setLaunchDays(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-2">
                  During this period, buyback and floor price are disabled
                </p>
              </div>

              <Button
                onClick={() => setStep("liquidity")}
                disabled={!title.trim()}
                className="w-full"
              >
                Next: Set Liquidity
              </Button>
            </div>
          )}

          {/* Liquidity Step */}
          {step === "liquidity" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Creator Forfeit (30%)</AlertTitle>
                <AlertDescription>
                  30% of your initial liquidity goes into the protocol pool. You keep 70% and
                  receive tokens.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="liquidity">Initial Liquidity (USD)</Label>
                <div className="flex gap-2 mt-2">
                  <DollarSign className="w-5 h-5 text-slate-400 mt-3" />
                  <Input
                    id="liquidity"
                    type="number"
                    value={initialLiquidity}
                    onChange={(e) => setInitialLiquidity(e.target.value)}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Liquidity Provided</span>
                  <span className="font-bold">${liquidityAmount.toLocaleString()}</span>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">30% Forfeit (to protocol)</span>
                    <span className="font-bold text-red-600">-${forfeit30Percent.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">70% You Keep (liquidity pool)</span>
                    <span className="font-bold text-green-600">${creatorKeeps70Percent.toLocaleString()}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Initial Tokens You Receive</span>
                      <span className="font-bold text-purple-600">
                        {initialTokens.toLocaleString()} @ $1/token
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  disabled={liquidityAmount < 1000}
                  className="flex-1"
                >
                  Review & Launch
                </Button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Title</p>
                    <p className="font-bold">{title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Launch Duration</p>
                    <div className="flex items-center gap-1 font-bold">
                      <Calendar className="w-4 h-4" /> {launchDays} days
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Liquidity Pool</p>
                    <p className="font-bold text-green-600">
                      ${creatorKeeps70Percent.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Your Tokens</p>
                    <p className="font-bold text-purple-600">
                      {initialTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Launch Requirements</AlertTitle>
                <AlertDescription>
                  ✓ Liquidity must be ≥ $1,000 <br />
                  ✓ After launch ends, trading & buyback enabled <br />
                  ✓ 5% emergency burn threshold active
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("liquidity")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleLaunch} disabled={loading} className="flex-1">
                  {loading ? "Launching..." : "Launch IP"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
