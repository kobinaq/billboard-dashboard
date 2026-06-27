import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import { ROLE_HOME } from "lib/constants";
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

  useEffect(() => {
    let active = true;
    const inactiveMessage =
      "Your account has been deactivated. Contact an administrator.";

    async function handleInactiveProfile() {
      if (supabase) {
        await supabase.auth.signOut();
      }

      if (active) {
        setSession(null);
        setProfile(null);
        setAuthError(inactiveMessage);
      }
    }

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
          const nextProfile = await fetchProfile(currentSession.user.id);
          if (nextProfile?.is_active === false) {
            await handleInactiveProfile();
            setLoading(false);
            return;
          }
          if (active) {
            setProfile(nextProfile);
          }
        } catch (error) {
          if (active) {
            setAuthError(getErrorMessage(error));
          }
        }
      }

      setLoading(false);
    }

    bootstrap();

    const {
      data: { subscription }
    } = supabase
      ? supabase.auth.onAuthStateChange(async (_, nextSession) => {
          setSession(nextSession);
          if (nextSession?.user?.id) {
            try {
              const nextProfile = await fetchProfile(nextSession.user.id);
              if (nextProfile?.is_active === false) {
                await handleInactiveProfile();
                setLoading(false);
                return;
              }
              setProfile(nextProfile);
              setAuthError("");
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
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      role: profile?.is_active ? profile.role : null,
      isActiveUser: Boolean(profile?.is_active),
      loading,
      authError,
      isAuthenticated: Boolean(session?.user && profile?.is_active !== false),
      defaultRoute:
        profile?.role && profile?.is_active ? ROLE_HOME[profile.role] : "/login",
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
      async refreshProfile() {
        if (!session?.user?.id) {
          return null;
        }

        const nextProfile = await fetchProfile(session.user.id);
        setProfile(nextProfile);
        return nextProfile;
      }
    }),
    [authError, loading, profile, session]
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
