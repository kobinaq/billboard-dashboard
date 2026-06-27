import { useCallback } from "react";
import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function listBillboards() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("billboards")
    .select(
      `
      *,
      contracts(
        id,
        client_id,
        status,
        start_date,
        end_date,
        clients(company_name)
      ),
      inspection_logs(id, inspected_at, overall_condition)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export function useBillboards() {
  const resource = useAsyncResource(listBillboards, []);

  const saveBillboard = useCallback(async (values, id) => {
    const client = requireSupabase();
    const query = id
      ? client.from("billboards").update(values).eq("id", id)
      : client.from("billboards").insert(values);
    const { data, error } = await query.select().single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  return { ...resource, saveBillboard };
}
