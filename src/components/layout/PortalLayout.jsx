import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50 md:flex">
      <Sidebar portal />
      <div className="min-h-screen flex-1">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <TopBar title="Client Portal" />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
