import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Instagram, Linkedin, Twitter, Facebook, Plus, Link2, Loader2, X, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsService } from "../lib/api";
import { useState } from "react";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Scheduler" },
      { name: "description", content: "Connect and manage your social media accounts." },
    ],
  }),
  component: Accounts,
});

const platformMeta: Record<string, { label: string; icon: any; color: string; hoverColor: string }> = {
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "bg-blue-600 text-white", hoverColor: "hover:bg-blue-700" },
  twitter: { label: "X (Twitter)", icon: Twitter, color: "bg-slate-900 text-white", hoverColor: "hover:bg-slate-800" },
  facebook: { label: "Facebook", icon: Facebook, color: "bg-blue-800 text-white", hoverColor: "hover:bg-blue-900" },
  threads: { label: "Threads", icon: Link2, color: "bg-black text-white", hoverColor: "hover:bg-neutral-900" },
  instagram: { label: "Instagram", icon: Instagram, color: "bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 text-white", hoverColor: "hover:opacity-90" },
};

function Accounts() {
  const queryClient = useQueryClient();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectError, setConnectError] = useState("");

  const { data: connectedAccounts = [], isLoading } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: accountsService.getAccounts,
  });

  const getConnectUrlMutation = useMutation({
    mutationFn: (platform: string) => accountsService.getConnectUrl(platform),
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setConnectError("Zernio returned an empty connection URL.");
        setConnectingPlatform(null);
      }
    },
    onError: (err: any) => {
      setConnectError(err.response?.data?.message || "Failed to generate connection URL.");
      setConnectingPlatform(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: accountsService.disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: accountsService.syncAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });

  const handleConnectPlatform = (platform: string) => {
    setConnectError("");
    setConnectingPlatform(platform);
    getConnectUrlMutation.mutate(platform);
  };

  const getPlatformIcon = (platformKey: string) => {
    return platformMeta[platformKey]?.icon || Link2;
  };

  const getPlatformLabel = (platformKey: string) => {
    return platformMeta[platformKey]?.label || platformKey;
  };

  const getPlatformMeta = (platformKey: string) => {
    return platformMeta[platformKey] || { color: "bg-slate-500 text-white", hoverColor: "hover:bg-slate-600" };
  };

  // Supported platforms list
  const allPlatforms = Object.keys(platformMeta);

  return (
    <>
      <PageHeader title="Social Accounts" subtitle="Manage and automate your social presence" />
      <div className="p-8 font-sans max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Connected Social Profiles</h2>
            <p className="text-sm text-slate-500 mt-1">
              Synchronize and route your content across your workspaces.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              title="Force Sync with Zernio"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 text-slate-600" />
              )}
              Sync Accounts
            </button>
            <button
              onClick={() => {
                setConnectError("");
                setShowConnectModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Connect Account
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-border bg-card p-12 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Link2 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base text-slate-800">No accounts connected yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Link your social accounts to enable post creation, scheduling, and multi-channel publishing.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 transition cursor-pointer"
            >
              Connect First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {connectedAccounts.map((acc: any) => {
              const Icon = getPlatformIcon(acc.platform);
              const status = acc.status || "connected";
              return (
                <div key={acc._id} className="flex items-center gap-4 rounded-xl bg-card border border-border p-5 hover:border-slate-300 transition shadow-sm">
                  {acc.avatarUrl ? (
                    <img src={acc.avatarUrl} alt={acc.name} className="h-11 w-11 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{acc.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {getPlatformLabel(acc.platform)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      status === "connected"
                        ? "bg-emerald-50 text-emerald-600"
                        : status === "expired"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                    }`}>
                      {status === "connected" ? "✓ Connected" : status === "expired" ? "Expired" : "Disconnected"}
                    </span>
                    <button
                      onClick={() => disconnectMutation.mutate(acc._id)}
                      className="text-slate-400 hover:text-red-500 transition cursor-pointer p-1 rounded-md hover:bg-slate-100"
                      title="Disconnect Account"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  if (!connectingPlatform) {
                    setShowConnectModal(false);
                  }
                }}
                disabled={!!connectingPlatform}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition disabled:opacity-30 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Social Account</h3>
              <p className="text-sm text-slate-500 mb-6">
                Authorize your social profiles securely via Zernio OAuth.
              </p>

              {connectError && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{connectError}</span>
                </div>
              )}

              <div className="space-y-3">
                {allPlatforms.map((platformKey) => {
                  const meta = getPlatformMeta(platformKey);
                  const Icon = getPlatformIcon(platformKey);
                  const isConnecting = connectingPlatform === platformKey;
                  const isAnyConnecting = connectingPlatform !== null;

                  return (
                    <button
                      key={platformKey}
                      onClick={() => handleConnectPlatform(platformKey)}
                      disabled={isAnyConnecting}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer disabled:opacity-40 select-none ${meta.color} ${meta.hoverColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>Connect {getPlatformLabel(platformKey)}</span>
                      </div>
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-70" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}