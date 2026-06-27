import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const routeMeta = {
  "/dashboard": {
    title: "Management Dashboard",
    subtitle: "Track occupancy, revenue, expiring contracts, and field health in one place."
  },
  "/billboards": {
    title: "Billboard Inventory",
    subtitle: "Manage traditional and digital boards across every region."
  },
  "/billboards/map": {
    title: "Billboard Map",
    subtitle: "Visualize inventory distribution and board status on the map."
  },
  "/clients": {
    title: "Client Management",
    subtitle: "Maintain client records, relationships, and contract value."
  },
  "/contracts": {
    title: "Contract Management",
    subtitle: "Control occupancy windows, renewals, and payment progress."
  },
  "/contracts/calendar": {
    title: "Contract Calendar",
    subtitle: "Review occupancy timelines by billboard."
  },
  "/inspections": {
    title: "Inspection Logs",
    subtitle: "Capture field status, maintenance risk, and proof photos."
  },
  "/payments": {
    title: "Payments",
    subtitle: "Record incoming payments and monitor collection status."
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage users and lookup values for system-wide consistency."
  }
};

export function AppLayout() {
  const location = useLocation();
  const meta = Object.entries(routeMeta).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || {
    title: "ThinkAloud",
    subtitle: "Billboard operations control center."
  };

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />
      <div className="min-h-screen flex-1">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <TopBar title={meta.title} subtitle={meta.subtitle} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
