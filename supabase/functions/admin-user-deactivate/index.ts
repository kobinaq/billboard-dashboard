import { optionsResponse, jsonResponse } from "../_shared/http.ts";
import { requireActiveAdmin } from "../_shared/auth.ts";
import { deactivateUserSchema } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const auth = await requireActiveAdmin(request);
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const payload = deactivateUserSchema.parse(await request.json());

    if (payload.userId === auth.callerUser.id) {
      return jsonResponse({ message: "You cannot deactivate your own account." }, 400);
    }

    const { count, error: countError } = await auth.serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_active", true);

    if (countError) {
      throw countError;
    }

    const { data: targetProfile, error: targetError } = await auth.serviceClient
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", payload.userId)
      .single();

    if (targetError || !targetProfile) {
      return jsonResponse({ message: "User not found." }, 404);
    }

    if (targetProfile.role === "admin" && (count || 0) <= 1) {
      return jsonResponse(
        { message: "You cannot deactivate the last active admin." },
        400
      );
    }

    const { error: updateError } = await auth.serviceClient
      .from("profiles")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: payload.reason?.trim() || null
      })
      .eq("id", payload.userId);

    if (updateError) {
      throw updateError;
    }

    const { error: signOutError } = await auth.serviceClient.auth.admin.signOut(
      payload.userId,
      "global"
    );
    if (signOutError) {
      return jsonResponse({
        userId: payload.userId,
        deactivated: true,
        message: "User deactivated. Existing sessions may last until they expire."
      });
    }

    return jsonResponse({
      userId: payload.userId,
      deactivated: true,
      message: "User deactivated successfully."
    });
  } catch (error) {
    return jsonResponse(
      {
        message: error instanceof Error ? error.message : "Unable to deactivate user."
      },
      400
    );
  }
});
