import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Instagram, Linkedin, Twitter, Facebook, Plus, Link2, Loader2, X } from "lucide-react";
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

const platformMeta: Record<string, { label: string; icon: any }> = {
  linkedin: { label: "LinkedIn", icon: Linkedin },
  twitter: { label: "X (Twitter)", icon: Twitter },
  facebook: { label: "Facebook", icon: Facebook },
  instagram: { label: "Instagram", icon: Instagram },
};

function Accounts() {
  const queryClient = useQueryClient();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");

  const { data: connectedAccounts = [], isLoading } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: accountsService.getAccounts,
  });

  const connectMutation = useMutation({
    mutationFn: () => accountsService.connectAccount(selectedPlatform, accountName, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      setShowConnectModal(false);
      setAccountName("");
      setAccountId("");
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

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountId) return;
    connectMutation.mutate();
  };

  const getPlatformIcon = (platformKey: string) => {
    return platformMeta[platformKey]?.icon || Link2;
  };

  const getPlatformLabel = (platformKey: string) => {
    return platformMeta[platformKey]?.label || platformKey;
  };

  // Find which of the 4 platforms are NOT yet connected
  const connectedPlatforms = connectedAccounts.map((acc: any) => acc.platform);
  const unconnectedPlatforms = Object.keys(platformMeta).filter(
    (p) => !connectedPlatforms.includes(p)
  );

  return (
    <>
      <PageHeader title="Social Accounts" subtitle="Manage and automate your social presence" />
      <div className="p-8 font-sans">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {connectedAccounts.length} of 4 platforms connected
            </p>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Connect Account
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {connectedAccounts.map((acc: any) => {
              const Icon = getPlatformIcon(acc.platform);
              return (
                <div key={acc._id} className="flex items-center gap-4 rounded-xl bg-card border border-border p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{acc.name}</div>
                    <div className="text-xs text-muted-foreground">{getPlatformLabel(acc.platform)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      ✓ Connected
                    </span>
                    <button
                      onClick={() => disconnectMutation.mutate(acc._id)}
                      className="text-muted-foreground hover:text-red-500 transition cursor-pointer"
                      title="Disconnect Account"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {unconnectedPlatforms.map((platformKey) => {
              const Icon = getPlatformIcon(platformKey);
              return (
                <div key={platformKey} className="flex items-center gap-4 rounded-xl bg-card border border-dashed border-border p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-muted-foreground">Not connected</div>
                    <div className="text-xs text-muted-foreground">{getPlatformLabel(platformKey)}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlatform(platformKey);
                      setShowConnectModal(true);
                    }}
                    className="text-xs font-medium text-primary hover:underline cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative">
              <button
                onClick={() => setShowConnectModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Connect Social Account</h3>

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  >
                    {Object.entries(platformMeta).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Profile Name / Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-red-500"
                    placeholder="e.g. johndoe"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-red-500"
                    placeholder="e.g. 12345678"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={connectMutation.isPending}
                    className="w-full inline-flex items-center justify-center rounded-full bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {connectMutation.isPending ? "Connecting..." : "Connect Platform"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}