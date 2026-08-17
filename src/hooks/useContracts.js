import { useCallback } from "react";
import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function syncContractStatuses(client) {
  try {
    await client.rpc("sync_contract_statuses");
  } catch {
    return false;
  }

  return true;
}

async function listContracts() {
  const client = requireSupabase();
  await syncContractStatuses(client);
  const { data, error } = await client
    .from("contracts")
    .select(
      `
      *,
      clients(id, profile_id, company_name, contact_name, contact_email),
      billboards(id, name, code, region, status, address),
      billboard_faces(id, label, facing_direction),
      payments(id, amount, payment_date)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export function useContracts() {
  const resource = useAsyncResource(listContracts, []);

  const saveContract = useCallback(async (values, id) => {
    const client = requireSupabase();
    const query = id
      ? client.from("contracts").update(values).eq("id", id)
      : client.from("contracts").insert(values);
    const { data, error } = await query.select().single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  const savePayment = useCallback(async (values) => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("payments")
      .insert(values)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  const attachArtwork = useCallback(async (id, artworkUrl) => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("contracts")
      .update({ artwork_url: artworkUrl })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  return { ...resource, saveContract, savePayment, attachArtwork };
}
