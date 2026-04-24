import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, FileText, Image as ImageIcon, Wrench } from "lucide-react";
import { useAppState } from "@/lib/use-app-state";
import { toast } from "sonner";
import type { ContentType } from "@/lib/data";

interface ProductPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductPostModal({ open, onOpenChange }: ProductPostModalProps) {
  const { publishContent } = useAppState();
  const [type, setType] = useState<ContentType>("pdf");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("29");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const types: { id: ContentType; label: string; description: string; icon: typeof FileText }[] = [
    {
      id: "pdf",
      label: "PDF Guide",
      description: "eBooks, guides, reports",
      icon: FileText,
    },
    {
      id: "art",
      label: "Artwork",
      description: "Digital art, illustrations",
      icon: ImageIcon,
    },
    {
      id: "tool",
      label: "Tool",
      description: "Software, templates, tools",
      icon: Wrench,
    },
  ];

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!fileName.trim()) {
      toast.error("File name is required");
      return;
    }

    if (parseFloat(price) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = publishContent({
        type,
        title,
        description,
        price: parseFloat(price),
        tokenize: false,
        fileName,
      });

      toast.success(`Product "${title}" posted successfully!`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to post product");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType("pdf");
    setTitle("");
    setDescription("");
    setPrice("29");
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Post New Product
          </DialogTitle>
          <DialogDescription>Create and list a digital product for sale</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Type Selection */}
          <div>
            <Label className="mb-3 block">Product Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {types.map(({ id, label, description: desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setType(id)}
                  className={`p-4 rounded-lg border-2 transition ${
                    type === id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title</Label>
              <Input
                id="title"
                placeholder="e.g., The Complete Guide to Digital Marketing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in your product. What will buyers learn or get?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  placeholder={`product_${type}`}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  How your file will be named for downloads
                </p>
              </div>

              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <div className="flex gap-2 mt-2">
                  <span className="text-slate-400 font-bold">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div className="bg-white rounded border p-3 space-y-2">
              <p className="font-bold">{title || "Product Title"}</p>
              <p className="text-sm text-slate-600">
                {description || "Your product description will appear here"}
              </p>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-slate-500">
                  {type.toUpperCase()} • {fileName || "filename"}
                </span>
                <span className="font-bold text-blue-600">${price}</span>
              </div>
            </div>
          </div>

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
            <Button onClick={handlePost} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Posting..." : "Post Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
