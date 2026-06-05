import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/AppSidebar";
import { Twitter, Linkedin, Facebook, Instagram, Calendar, Clock, Upload, Send, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsService, accountsService } from "../lib/api";
import { z } from "zod";

const searchSchema = z.object({
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
});

export const Route = createFileRoute("/scheduler")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Post Scheduler — Scheduler" },
      { name: "description", content: "Schedule posts across your social platforms." },
    ],
  }),
  component: Scheduler,
});

const platforms = [
  { key: "x", icon: Twitter, label: "X (Twitter)" },
  { key: "li", icon: Linkedin, label: "LinkedIn" },
  { key: "fb", icon: Facebook, label: "Facebook" },
  { key: "ig", icon: Instagram, label: "Instagram" },
];

const platformIcons: Record<string, any> = {
  x: Twitter,
  li: Linkedin,
  fb: Facebook,
  ig: Instagram,
};

function Scheduler() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedSelection = useRef(false);
  const [selected, setSelected] = useState<string[]>(["x"]);
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Prefill content from search query parameter if provided
  useEffect(() => {
    if (search.content) {
      setContent(search.content);
    }
    if (search.mediaUrl) {
      setMediaPreview(search.mediaUrl);
    }
  }, [search.content, search.mediaUrl]);

  // Load connected accounts to warn user if they select a platform they haven't connected yet!
  const { data: connectedAccounts = [] } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: accountsService.getAccounts,
  });

  const connectedPlatformKeys = connectedAccounts.map((acc: any) => {
    if (acc.platform === "twitter") return "x";
    if (acc.platform === "linkedin") return "li";
    if (acc.platform === "facebook") return "fb";
    if (acc.platform === "instagram") return "ig";
    return acc.platform;
  });

  // Dynamically default selected platforms to the connected ones on initial load
  useEffect(() => {
    if (!hasInitializedSelection.current && connectedAccounts.length > 0) {
      const activeKeys = connectedAccounts.map((acc: any) => {
        if (acc.platform === "twitter") return "x";
        if (acc.platform === "linkedin") return "li";
        if (acc.platform === "facebook") return "fb";
        if (acc.platform === "instagram") return "ig";
        return acc.platform;
      });
      setSelected(activeKeys);
      hasInitializedSelection.current = true;
    }
  }, [connectedAccounts]);

  // Queries for Scheduler
  const { data: upcoming = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ["posts-upcoming"],
    queryFn: postsService.getUpcoming,
  });

  const { data: published = [], isLoading: loadingPublished } = useQuery({
    queryKey: ["posts-published"],
    queryFn: postsService.getPublished,
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: postsService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["posts-published"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      
      // Reset form
      setContent("");
      setDate("");
      setTime("");
      setMediaFile(null);
      setMediaPreview(null);
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to create post.");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: postsService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });

  const publishImmediatelyMutation = useMutation({
    mutationFn: postsService.publishImmediately,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["posts-published"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });

  const toggle = (k: string) =>
    setSelected((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setFormError("Please select at least one platform.");
      return;
    }
    if (!content.trim()) {
      setFormError("Please enter post content.");
      return;
    }

    // Check if any selected platforms are not connected
    const unconnectedSelected = selected.filter(k => !connectedPlatformKeys.includes(k));
    if (unconnectedSelected.length > 0) {
      const names = unconnectedSelected.map(k => platforms.find(p => p.key === k)?.label).join(", ");
      setFormError(`Please connect accounts for the following selected platforms: ${names}`);
      return;
    }

    setFormError("");
    const formData = new FormData();
    formData.append("platforms", JSON.stringify(selected));
    formData.append("content", content);
    if (mediaFile) {
      formData.append("media", mediaFile);
    } else if (mediaPreview && (mediaPreview.startsWith("http://") || mediaPreview.startsWith("https://"))) {
      formData.append("mediaUrl", mediaPreview);
    }
    if (date && time) {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      formData.append("scheduledAt", scheduledAt);
    }

    createPostMutation.mutate(formData);
  };

  const getPlatformIcon = (platformKey: string) => {
    const Icon = platformIcons[platformKey];
    return Icon || Send;
  };

  return (
    <>
      <PageHeader title="Post Scheduler" subtitle="Manage and automate your social presence" />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        {/* Compose */}
        <form onSubmit={handleSubmit} className="rounded-xl bg-card border border-border p-6 space-y-5 h-fit">
          <h3 className="font-semibold text-lg text-slate-800">Compose Post</h3>

          {formError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{formError}</p>
          )}

          <div>
            <div className="text-[11px] font-medium tracking-widest text-slate-500 mb-2 uppercase">PLATFORMS</div>
            <div className="flex gap-2">
              {platforms.map(({ key, icon: Icon, label }) => {
                const active = selected.includes(key);
                const connected = connectedPlatformKeys.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`grid h-10 w-10 place-items-center rounded-lg border transition relative cursor-pointer ${
                      active
                        ? "border-primary bg-accent text-primary"
                        : "border-border text-foreground/70 hover:bg-secondary"
                    }`}
                    title={`${label} ${connected ? "(Connected)" : "(Not connected)"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {!connected && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-white" title="Account not connected" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium tracking-widest text-slate-500 mb-2 uppercase">CONTENT</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 280))}
              placeholder="What do you want to share today?"
              className="w-full h-32 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">{content.length}/280</div>
          </div>

          <div>
            <div className="text-[11px] font-medium tracking-widest text-slate-500 mb-2 uppercase">MEDIA (OPTIONAL)</div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            {mediaPreview ? (
              <div className="relative rounded-lg border border-border overflow-hidden group">
                <img src={mediaPreview} alt="Upload preview" className="w-full aspect-video object-cover" />
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full p-1.5 transition text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-8 text-sm text-slate-500 hover:border-primary/50 cursor-pointer hover:bg-slate-50 transition"
              >
                <Upload className="h-5 w-5" />
                Click to upload image or video
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-medium tracking-widest text-slate-500 mb-2 uppercase">DATE (OPTIONAL)</div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium tracking-widest text-slate-500 mb-2 uppercase">TIME (OPTIONAL)</div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createPostMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
              </>
            ) : date && time ? (
              <>
                Schedule Post <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Publish Immediately <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Right side lists */}
        <div className="space-y-6">
          {/* Upcoming scheduled posts */}
          <div className="rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                <Calendar className="h-4 w-4" /> Upcoming
              </div>
              <span className="text-xs text-muted-foreground">
                {loadingUpcoming ? "..." : upcoming.length}
              </span>
            </div>
            {loadingUpcoming ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : upcoming.length === 0 ? (
              <p className="p-5 text-center text-sm text-slate-400">No upcoming scheduled posts.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((p: any) => (
                  <li key={p._id} className="px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {p.platforms.map((pfKey: string) => {
                          const Icon = getPlatformIcon(pfKey);
                          return (
                            <span key={pfKey} className="grid h-7 w-7 place-items-center rounded bg-secondary" title={pfKey}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                          );
                        })}
                      </div>
                      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        {p.mediaUrl && <span className="px-2 py-0.5 rounded bg-secondary">Image</span>}
                        <span>{new Date(p.scheduledAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                    <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => publishImmediatelyMutation.mutate(p._id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Publish Now
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        onClick={() => deletePostMutation.mutate(p._id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Published posts */}
          <div className="rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                <Send className="h-4 w-4" /> Published
              </div>
              <span className="text-xs text-muted-foreground">
                {loadingPublished ? "..." : published.length}
              </span>
            </div>
            {loadingPublished ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : published.length === 0 ? (
              <p className="p-5 text-center text-sm text-slate-400">No published posts yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {published.map((p: any) => (
                  <li key={p._id} className="px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {p.platforms.map((pfKey: string) => {
                          const Icon = getPlatformIcon(pfKey);
                          return (
                            <span key={pfKey} className="grid h-7 w-7 place-items-center rounded bg-secondary" title={pfKey}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                          );
                        })}
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : new Date(p.createdAt).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-medium ${p.status === "failed" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {p.status === "failed" ? "Failed" : "Published"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                    {p.errorMessage && (
                      <p className="text-[11px] text-red-500 bg-red-50/50 rounded p-2 mt-1">Error: {p.errorMessage}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}