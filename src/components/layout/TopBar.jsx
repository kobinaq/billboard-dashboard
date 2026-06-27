import { LogOut, Menu } from "lucide-react";
import { Button } from "components/ui/Button";
import { useApp } from "context/AppContext";
import { useAuth } from "context/AuthContext";
import { getInitials, titleCase } from "lib/utils";

export function TopBar({ title, subtitle }) {
  const { toggleSidebar } = useApp();
  const { profile, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 rounded-2xl border border-slate-200 bg-white p-3 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {profile?.full_name || "Guest user"}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {titleCase(profile?.role || "visitor")}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-sm font-semibold text-white">
          {getInitials(profile?.full_name || "Visitor")}
        </div>
        <Button type="button" variant="secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
