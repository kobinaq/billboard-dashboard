import { requireSupabase } from "lib/supabase";
import { useAsyncResource } from "./useAsyncResource";

async function listPayments() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("payments")
    .select(
      `
      *,
      contracts(contract_number, clients(company_name), billboards(name), billboard_faces(label))
    `
    )
    .order("payment_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export function usePayments() {
  return useAsyncResource(listPayments, []);
}
