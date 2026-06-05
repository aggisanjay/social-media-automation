import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppSidebar";
import { Send, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Scheduler" },
      { name: "description", content: "Manage and automate your social presence" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  });

  const { data: activity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardService.getActivity,
  });

  const stats = [
    { value: statsData?.scheduled ?? 0, label: "Scheduled Posts", note: "Active queue" },
    { value: statsData?.published ?? 0, label: "Published Posts", note: "All time" },
    { value: statsData?.accounts ?? 0, label: "Connected Accounts", note: "Active connections" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Manage and automate your social presence" />
      <div className="p-8 space-y-8 font-sans">
        <div>
          <h2 className="text-2xl font-bold">Good morning! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your social accounts today.
          </p>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-card border border-border p-5">
                <div className="flex items-start justify-between">
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {s.note}
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold">Recent Activity</h3>
            <span className="text-xs text-muted-foreground">
              {loadingActivity ? "Loading..." : `${activity.length} events`}
            </span>
          </div>
          {loadingActivity ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activity.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recent activity logs found.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a: any, i: number) => (
                <li key={i} className="flex items-center gap-4 px-6 py-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Send className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-accent text-primary mb-1 capitalize">
                      {a.action}
                    </span>
                    <div className="text-sm">{a.what}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{a.when}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
