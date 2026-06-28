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
      billboard_faces(id, label, facing_direction, is_active),
      contracts(
        id,
        client_id,
        billboard_face_id,
        status,
        start_date,
        end_date,
        billboard_faces(label),
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

  const updateCoverImage = useCallback(async (id, coverImageUrl) => {
    const client = requireSupabase();
    const { data, error } = await client
      .from("billboards")
      .update({ cover_image_url: coverImageUrl })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }, []);

  const saveBillboardFaces = useCallback(async (billboardId, faces = []) => {
    const client = requireSupabase();
    const keptIds = faces.map((face) => face.id).filter(Boolean);

    if (keptIds.length) {
      const { error: deactivateError } = await client
        .from("billboard_faces")
        .update({ is_active: false })
        .eq("billboard_id", billboardId)
        .not("id", "in", `(${keptIds.join(",")})`);

      if (deactivateError) {
        throw deactivateError;
      }
    } else {
      const { error: deactivateError } = await client
        .from("billboard_faces")
        .update({ is_active: false })
        .eq("billboard_id", billboardId);

      if (deactivateError) {
        throw deactivateError;
      }
    }

    for (const face of faces) {
      const values = {
        billboard_id: billboardId,
        label: face.label,
        facing_direction: face.facing_direction || null,
        is_active: face.is_active !== false
      };

      const query = face.id
        ? client.from("billboard_faces").update(values).eq("id", face.id)
        : client.from("billboard_faces").insert(values);

      const { error } = await query;
      if (error) {
        throw error;
      }
    }
  }, []);

  return { ...resource, saveBillboard, updateCoverImage, saveBillboardFaces };
}
