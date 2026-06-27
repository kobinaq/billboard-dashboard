import { Navigate, Outlet } from "react-router-dom";
import { ROLE_HOME } from "lib/constants";
import { useAuth } from "context/AuthContext";

export default function RoleRoute({ allow }) {
  const { role } = useAuth();

  if (!allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || "/login"} replace />;
  }

  return <Outlet />;
}
