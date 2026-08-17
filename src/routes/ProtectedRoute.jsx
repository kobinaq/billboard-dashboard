import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "components/ui/Button";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { useAuth } from "context/AuthContext";

export default function ProtectedRoute() {
  const { auth, isAuthenticated, loading, authError, retryProfile, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Preparing your workspace..." />
      </div>
    );
  }

  if (auth.kind === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Could not load your profile</h1>
          <p className="text-sm text-amber-800">{authError}</p>
          <div className="flex justify-center gap-3">
            <Button type="button" onClick={retryProfile}>
              Try again
            </Button>
            <Button type="button" variant="secondary" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
