import { NavLink } from "react-router-dom";
import { Building2, X } from "lucide-react";
import { ADMIN_NAV_ITEM, CLIENT_PORTAL_NAV, INTERNAL_NAV } from "lib/constants";
import { cn } from "lib/utils";
import { useApp } from "context/AppContext";
import { useAuth } from "context/AuthContext";

function SidebarLink({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-white text-brand-800 shadow-lg shadow-slate-950/10"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function Sidebar({ portal = false }) {
  const { sidebarOpen, closeSidebar } = useApp();
  const { role } = useAuth();

  const sections = portal
    ? [{ items: CLIENT_PORTAL_NAV }]
    : INTERNAL_NAV.filter((section) => section.roles.includes(role));

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/40 transition md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeSidebar}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-80 flex-col bg-brand-900 bg-grid-fade bg-grid-fade p-6 text-white transition md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-brand-100">
                ThinkAloud
              </p>
              <h1 className="text-lg font-semibold text-white">
                {portal ? "Client Portal" : "Billboard Suite"}
              </h1>
            </div>
          </div>
          <button type="button" className="md:hidden" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-8">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              {section.items.map((item) => (
                <SidebarLink key={item.to} item={item} onClick={closeSidebar} />
              ))}
            </div>
          ))}
        </nav>

        {!portal && role === "admin" ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <SidebarLink item={ADMIN_NAV_ITEM} onClick={closeSidebar} />
          </div>
        ) : null}
      </aside>
    </>
  );
}
