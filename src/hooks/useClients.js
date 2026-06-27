import { useCallback } from "react";
import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function listClients() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("clients")
    .select(
      `
      *,
      contracts(id, total_value, status),
      profiles(id, full_name, email, role, is_active)
    `
    )
    .order("company_name");

  if (error) {
    throw error;
  }

  return data;
}

export function useClients() {
  const resource = useAsyncResource(listClients, []);

  const saveClient = useCallback(async (values, id) => {
    const client = requireSupabase();
    const query = id
      ? client.from("clients").update(values).eq("id", id)
      : client.from("clients").insert(values);
    const { data, error } = await query.select().single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  return { ...resource, saveClient };
}
