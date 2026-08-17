import { deriveAuthState, isActiveAuth } from "./authState";

const session = { user: { id: "user-1" } };
const profile = { id: "user-1", role: "admin", is_active: true };

describe("deriveAuthState", () => {
  it("is loading before session or profile settle", () => {
    expect(
      deriveAuthState({
        session,
        profile: null,
        loading: true,
        error: ""
      })
    ).toEqual({ kind: "loading" });
  });

  it("is anonymous with no session", () => {
    expect(
      deriveAuthState({
        session: null,
        profile: null,
        loading: false,
        error: "deactivated"
      })
    ).toEqual({ kind: "anonymous", error: "deactivated" });
  });

  it("is active only when the profile is present and active", () => {
    const state = deriveAuthState({
      session,
      profile,
      loading: false,
      error: ""
    });

    expect(state).toEqual({
      kind: "active",
      session,
      profile,
      role: "admin"
    });
    expect(isActiveAuth(state)).toBe(true);
  });

  it("does not treat a session with a missing profile as authenticated", () => {
    const state = deriveAuthState({
      session,
      profile: null,
      loading: false,
      error: "network down"
    });

    expect(state.kind).toBe("error");
    expect(state.error).toBe("network down");
    expect(isActiveAuth(state)).toBe(false);
  });

  it("marks deactivated profiles even if a session is still present", () => {
    expect(
      deriveAuthState({
        session,
        profile: { ...profile, is_active: false },
        loading: false,
        error: ""
      }).kind
    ).toBe("deactivated");
  });
});
