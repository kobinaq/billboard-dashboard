import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import AppRoutes from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
