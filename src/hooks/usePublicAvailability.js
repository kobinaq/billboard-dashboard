import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function listPublicAvailability() {
  const client = requireSupabase();
  const { data, error } = await client.rpc("public_billboard_availability");

  if (error) {
    throw error;
  }

  return data || [];
}

export function usePublicAvailability() {
  return useAsyncResource(listPublicAvailability, []);
}
