export function deriveAuthState({ session, profile, loading, error }) {
  if (loading) {
    return { kind: "loading" };
  }

  if (!session?.user) {
    return { kind: "anonymous", error: error || "" };
  }

  if (profile?.is_active === false) {
    return {
      kind: "deactivated",
      error: error || "Your account has been deactivated. Contact an administrator."
    };
  }

  if (profile?.is_active && profile.role) {
    return {
      kind: "active",
      session,
      profile,
      role: profile.role
    };
  }

  return {
    kind: "error",
    session,
    error: error || "Could not load your profile."
  };
}

export function isActiveAuth(state) {
  return state.kind === "active";
}
