import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const routeMeta = {
  "/dashboard": {
    title: "Management Dashboard"
  },
  "/billboards": {
    title: "Billboard Inventory"
  },
  "/billboards/map": {
    title: "Billboard Map"
  },
  "/clients": {
    title: "Client Management"
  },
  "/contracts": {
    title: "Contract Management"
  },
  "/contracts/calendar": {
    title: "Contract Calendar"
  },
  "/inspections": {
    title: "Inspection Logs"
  },
  "/payments": {
    title: "Payments"
  },
  "/settings": {
    title: "Settings"
  }
};

export function AppLayout() {
  const location = useLocation();
  const meta = Object.entries(routeMeta).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || {
    title: "ThinkAloud"
  };

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />
      <div className="min-h-screen flex-1">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <TopBar title={meta.title} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
