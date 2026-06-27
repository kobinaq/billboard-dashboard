import { requireSupabase } from "./supabase";

async function invokeAdminFunction(name, body) {
  const client = requireSupabase();
  const {
    data: { session }
  } = await client.auth.getSession();

  const { data, error } = await client.functions.invoke(name, {
    body,
    headers: session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`
        }
      : undefined
  });

  if (error) {
    throw error;
  }

  return data;
}

export function upsertManagedUser(payload) {
  return invokeAdminFunction("admin-user-upsert", payload);
}

export function deactivateManagedUser(payload) {
  return invokeAdminFunction("admin-user-deactivate", payload);
}
