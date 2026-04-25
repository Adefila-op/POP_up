import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppState } from "@/lib/use-app-state";

interface DiscoveryPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DiscoveryPostModal({ open, onOpenChange }: DiscoveryPostModalProps) {
  const { createdContent } = useAppState();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handlePost = async () => {
    if (!selectedProduct) {
      toast.error("Select a product to repost");
      return;
    }

    if (!description.trim()) {
      toast.error("Add a description for this repost");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Product reposted to discovery!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to repost product");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct("");
    setDescription("");
    setTags("");
    setPreviewMode(false);
  };

  const product = createdContent.find(c => c.id === selectedProduct);
  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-600" />
            Repost Product
          </DialogTitle>
          <DialogDescription>
            Share your product to the discovery feed with a new description or angle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 border rounded-lg p-1 bg-slate-50">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex-1 py-2 rounded transition ${
                !previewMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`flex-1 py-2 rounded transition ${
                previewMode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Preview
            </button>
          </div>

          {!previewMode ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Select Product to Repost</Label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Choose a product...</option>
                  {createdContent.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} (${product.price})
                    </option>
                  ))}
                </select>
                {product && (
                  <p className="text-xs text-slate-500 mt-2">
                    {product.type.toUpperCase()} • {product.sales} sales
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Repost Description</Label>
                <Textarea
                  id="description"
                  placeholder="Share why you're reposting this product, highlight its benefits, or tell a story about its creation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-32 resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {description.length}/5000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., digital-product, creator-tools, must-have"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tags help your post reach relevant audiences
                </p>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Reposts are visible to all creators and can help boost sales and awareness
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            // Preview Mode
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {product?.title || "Select a product"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  by You • Just now • {product && `${product.type.toUpperCase()} • $${product.price}`}
                </p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {description || "Your repost description will appear here..."}
                </p>
              </div>

              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {tagList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {product && (
                <div className="bg-slate-50 p-4 rounded mt-4">
                  <p className="text-sm font-medium text-slate-600">Original Product</p>
                  <div className="flex justify-between mt-2">
                    <div>
                      <p className="text-sm">{product.title}</p>
                      <p className="text-xs text-slate-500">${product.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{product.sales} sales</p>
                      <p className="text-xs text-slate-500">⭐ {product.rating}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={loading || !selectedProduct || !description.trim()}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {loading ? "Posting..." : "Repost to Discovery"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
