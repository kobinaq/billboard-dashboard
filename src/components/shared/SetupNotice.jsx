import { AlertTriangle } from "lucide-react";
import { EmptyState } from "components/ui/EmptyState";
import { isSupabaseConfigured } from "lib/supabase";

export function SetupNotice() {
  if (isSupabaseConfigured) {
    return null;
  }

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Supabase connection required"
      description="Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to start loading live data. The UI is wired for the real backend, but the app will stay read-only until those values are present."
    />
  );
}
