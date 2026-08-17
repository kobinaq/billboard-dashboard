import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import { ROLE_HOME } from "lib/constants";
import { deriveAuthState, isActiveAuth } from "lib/authState";
import { getErrorMessage } from "lib/utils";
import { requireSupabase, supabase } from "lib/supabase";

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const loadProfile = useCallback(async (userId) => {
    const nextProfile = await fetchProfile(userId);
    if (nextProfile?.is_active === false) {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setProfile(null);
      setAuthError("Your account has been deactivated. Contact an administrator.");
      return null;
    }

    setProfile(nextProfile);
    setAuthError("");
    return nextProfile;
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSession(currentSession);

      if (currentSession?.user?.id) {
        try {
          await loadProfile(currentSession.user.id);
        } catch (error) {
          if (active) {
            setProfile(null);
            setAuthError(getErrorMessage(error));
          }
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    bootstrap();

    const {
      data: { subscription }
    } = supabase
      ? supabase.auth.onAuthStateChange(async (_, nextSession) => {
          setSession(nextSession);
          if (nextSession?.user?.id) {
            try {
              await loadProfile(nextSession.user.id);
            } catch (error) {
              setProfile(null);
              setAuthError(getErrorMessage(error));
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        })
      : { data: { subscription: { unsubscribe() {} } } };

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const auth = deriveAuthState({ session, profile, loading, error: authError });

  const value = useMemo(
    () => ({
      auth,
      session: auth.kind === "active" ? auth.session : session,
      user: session?.user || null,
      profile: auth.kind === "active" ? auth.profile : profile,
      role: auth.kind === "active" ? auth.role : null,
      isActiveUser: auth.kind === "active",
      loading: auth.kind === "loading",
      authError: auth.error || "",
      isAuthenticated: isActiveAuth(auth),
      defaultRoute: auth.kind === "active" ? ROLE_HOME[auth.role] : "/login",
      async login({ email, password }) {
        const client = requireSupabase();
        const { error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        toast.success("Welcome back.");
      },
      async logout() {
        if (!supabase) {
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }

        toast.success("Signed out.");
      },
      async retryProfile() {
        if (!session?.user?.id) {
          return null;
        }

        setLoading(true);
        try {
          return await loadProfile(session.user.id);
        } catch (error) {
          setProfile(null);
          setAuthError(getErrorMessage(error));
          return null;
        } finally {
          setLoading(false);
        }
      }
    }),
    [auth, loadProfile, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
