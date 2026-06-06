import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppSidebar";
import { ArrowRight, History, Sparkles, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiService } from "../lib/api";

export const Route = createFileRoute("/ai-composer")({
  head: () => ({
    meta: [
      { title: "AI Composer — Scheduler" },
      { name: "description", content: "Generate engaging social media posts with AI." },
    ],
  }),
  component: AIComposer,
});

const tones = ["Professional", "Creative", "Funny", "Minimalist", "Excited"];

function AIComposer() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tone, setTone] = useState("Professional");
  const [prompt, setPrompt] = useState("");
  const [aiImage, setAiImage] = useState(true);
  const [error, setError] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState<any | null>(null);

  const { data: generations = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["ai-generations"],
    queryFn: aiService.getHistory,
  });

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateContent(prompt, tone, aiImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-generations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      setPrompt("");
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to generate content.");
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate();
  };

  const handleSchedulePost = (text: string, img?: string) => {
    navigate({
      to: "/scheduler",
      search: { content: text, mediaUrl: img },
    });
  };

  return (
    <>
      <PageHeader title="AI Composer" subtitle="Manage and automate your social presence" />
      <div className="p-8 max-w-5xl mx-auto w-full font-sans">
        <h2 className="text-2xl font-semibold text-center mb-6">What should we create today?</h2>

        <div className="rounded-xl bg-card border border-border p-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Share your idea… (e.g. A post about the launch of our new eco-friendly coffee beans)"
            className="w-full h-24 resize-none bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex items-center justify-end gap-4 pt-2 border-t border-border">
            <label className="flex items-center gap-2 text-sm select-none">
              AI Image
              <button
                onClick={() => setAiImage(!aiImage)}
                className={`relative h-5 w-9 rounded-full transition cursor-pointer ${aiImage ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${aiImage ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </label>
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-40 cursor-pointer"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-4 py-1.5 rounded-full text-sm border transition cursor-pointer ${
                tone === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground/70 hover:bg-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" /> Recent Generations
            </div>
            <span className="text-xs text-muted-foreground">
              {loadingHistory ? "..." : `${generations.length} total`}
            </span>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : generations.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">
              No recent AI generations. Write a prompt above to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {generations.map((g: any) => (
                <div key={g.id} className="rounded-xl bg-card border border-border p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{g.date}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-accent text-primary">{g.tone}</span>
                  </div>
                  <div className="cursor-pointer group/content" onClick={() => setSelectedGeneration(g)}>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {g.text.length > 100 ? `${g.text.substring(0, 100)}...` : g.text}
                    </p>
                    {g.text.length > 100 && (
                      <span className="text-xs font-semibold text-primary group-hover/content:underline mt-1 block">
                        Read More
                      </span>
                    )}
                  </div>
                  {g.img && (
                    <img src={g.img} alt="" className="rounded-lg aspect-video cursor-pointer object-cover hover:opacity-95 transition" loading="lazy" onClick={() => setSelectedGeneration(g)} />
                  )}
                  <button
                    onClick={() => handleSchedulePost(g.text, g.img)}
                    className="w-full rounded-lg bg-secondary py-2 text-xs font-medium hover:bg-secondary/70 transition cursor-pointer"
                  >
                    Schedule Post
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generation Details Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedGeneration.date}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-accent text-primary">
                  {selectedGeneration.tone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGeneration(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {selectedGeneration.img && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={selectedGeneration.img} alt="Generated media" className="w-full aspect-video object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <div className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">GENERATED CONTENT</div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  {selectedGeneration.text}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-border bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  handleSchedulePost(selectedGeneration.text, selectedGeneration.img);
                  setSelectedGeneration(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer"
              >
                Schedule Post
              </button>
              <button
                type="button"
                onClick={() => setSelectedGeneration(null)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}