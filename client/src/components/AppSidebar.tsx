import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Users, Calendar, Wand2, LogOut, Zap } from "lucide-react";
import { authService } from "../lib/api";
import { useState, useEffect } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/scheduler", label: "Scheduler", icon: Calendar },
  { to: "/ai-composer", label: "AI Composer", icon: Wand2 },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const name = user?.name || "User";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await authService.logout();
      navigate({ to: "/login" });
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between border-r border-border bg-card px-5 py-6">
      <div>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-10">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Scheduler</span>
        </Link>
 
        <div className="px-2 mb-3 text-[11px] font-medium tracking-widest text-muted-foreground">
          MENU
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-accent text-primary font-medium"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">{name}</div>
            <div className="text-xs text-muted-foreground truncate">{email}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border bg-card/60 px-8 py-5">
      <h1 className="text-base font-semibold">{title}</h1>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}