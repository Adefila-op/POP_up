import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiscoveryPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DiscoveryPostModal({ open, onOpenChange }: DiscoveryPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Post created successfully!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTags("");
    setPreviewMode(false);
  };

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
            Create Discovery Post
          </DialogTitle>
          <DialogDescription>
            Share your story, tips, or updates with the creator community
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
                <Label htmlFor="title">Post Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., How I grew my creator business to $10k/month"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                  maxLength={120}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {title.length}/120 characters
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your story, insights, or tips... You can include links, tips, and engage with your audience."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-2 min-h-32 resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {content.length}/5000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., entrepreneurship, creator-economy, digital-products"
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
                  Posts are visible to all creators and can help build your audience and credibility
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            // Preview Mode
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{title || "Post Title"}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  by You • Just now • {tagList.length} tags
                </p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {content || "Your post content will appear here..."}
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

              <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-slate-500">Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-slate-500">Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-slate-500">Comments</p>
                </div>
              </div>
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
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {loading ? "Posting..." : "Post to Discovery"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
