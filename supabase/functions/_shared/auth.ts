import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { jsonResponse } from "./http.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createCallerClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function requireActiveAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return {
      error: jsonResponse({ message: "Missing authorization header." }, 401)
    };
  }

  const callerClient = createCallerClient(authHeader);
  const serviceClient = createServiceClient();

  const {
    data: { user },
    error: userError
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return {
      error: jsonResponse({ message: "Invalid or expired session." }, 401)
    };
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: jsonResponse({ message: "Admin profile not found." }, 403)
    };
  }

  if (profile.role !== "admin" || !profile.is_active) {
    return {
      error: jsonResponse({ message: "Admin access required." }, 403)
    };
  }

  return {
    authHeader,
    callerUser: user,
    adminProfile: profile,
    serviceClient
  };
}
