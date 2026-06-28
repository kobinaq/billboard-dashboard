import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/layout/AppLayout";
import { PortalLayout } from "components/layout/PortalLayout";
import { useAuth } from "context/AuthContext";
import Login from "pages/auth/Login";
import ManagementDashboard from "pages/dashboard/ManagementDashboard";
import BillboardList from "pages/billboards/BillboardList";
import BillboardMap from "pages/billboards/BillboardMap";
import BillboardDetail from "pages/billboards/BillboardDetail";
import BillboardForm from "pages/billboards/BillboardForm";
import ClientList from "pages/clients/ClientList";
import ClientDetail from "pages/clients/ClientDetail";
import ClientForm from "pages/clients/ClientForm";
import ContractList from "pages/contracts/ContractList";
import ContractCalendar from "pages/contracts/ContractCalendar";
import ContractDetail from "pages/contracts/ContractDetail";
import ContractForm from "pages/contracts/ContractForm";
import InspectionList from "pages/inspections/InspectionList";
import InspectionForm from "pages/inspections/InspectionForm";
import InspectionDetail from "pages/inspections/InspectionDetail";
import PaymentList from "pages/payments/PaymentList";
import PaymentForm from "pages/payments/PaymentForm";
import ClientPortal from "pages/portal/ClientPortal";
import ClientPortalBoards from "pages/portal/ClientPortalBoards";
import ClientPortalContracts from "pages/portal/ClientPortalContracts";
import PublicAvailability from "pages/public/PublicAvailability";
import SettingsPage from "pages/settings/SettingsPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  const { isAuthenticated, defaultRoute } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Login />}
      />
      <Route path="/availability" element={<PublicAvailability />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={["admin", "sales", "inspector"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/billboards" element={<BillboardList />} />
            <Route path="/billboards/map" element={<BillboardMap />} />
            <Route path="/billboards/new" element={<BillboardForm />} />
            <Route path="/billboards/:id" element={<BillboardDetail />} />
            <Route path="/billboards/:id/edit" element={<BillboardForm />} />
            <Route path="/inspections" element={<InspectionList />} />
            <Route path="/inspections/new" element={<InspectionForm />} />
            <Route path="/inspections/:id" element={<InspectionDetail />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["admin", "sales"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ManagementDashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/calendar" element={<ContractCalendar />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/contracts/:id/edit" element={<ContractForm />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/payments/new" element={<PaymentForm />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["admin"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["client"]} />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<ClientPortal />} />
            <Route path="/portal/boards" element={<ClientPortalBoards />} />
            <Route path="/portal/contracts" element={<ClientPortalContracts />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />}
      />
    </Routes>
  );
}
