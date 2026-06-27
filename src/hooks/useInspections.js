import { useCallback } from "react";
import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function listInspections() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("inspection_logs")
    .select(
      `
      *,
      billboards(name, code),
      profiles(full_name),
      inspection_photos(id, photo_url, caption)
    `
    )
    .order("inspected_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export function useInspections() {
  const resource = useAsyncResource(listInspections, []);

  const saveInspection = useCallback(async (values, id) => {
    const client = requireSupabase();
    const query = id
      ? client.from("inspection_logs").update(values).eq("id", id)
      : client.from("inspection_logs").insert(values);
    const { data, error } = await query.select().single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  return { ...resource, saveInspection };
}
