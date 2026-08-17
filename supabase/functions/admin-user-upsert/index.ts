import { optionsResponse, jsonResponse } from "../_shared/http.ts";
import { requireActiveAdmin } from "../_shared/auth.ts";
import { userUpsertSchema } from "../_shared/validation.ts";

function normalizeString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function waitForProfile(serviceClient, userId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return null;
}

async function findExistingProfile(serviceClient, email: string) {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureClientLink(serviceClient, payload, profileId: string) {
  if (payload.role !== "client") {
    await serviceClient.from("clients").update({ profile_id: null }).eq("profile_id", profileId);
    return null;
  }

  const clientValues = {
    profile_id: profileId,
    company_name: normalizeString(payload.companyName) || payload.fullName,
    contact_name: normalizeString(payload.contactName) || payload.fullName,
    contact_email: payload.email,
    contact_phone: normalizeString(payload.contactPhone) || normalizeString(payload.phone),
    industry: normalizeString(payload.industry),
    address: normalizeString(payload.address),
    notes: normalizeString(payload.notes)
  };

  if (payload.clientId) {
    const { data, error } = await serviceClient
      .from("clients")
      .update(clientValues)
      .eq("id", payload.clientId)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    await serviceClient
      .from("clients")
      .update({ profile_id: null })
      .neq("id", payload.clientId)
      .eq("profile_id", profileId);

    return data.id;
  }

  const { data: linkedClient, error: linkedError } = await serviceClient
    .from("clients")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (linkedError) {
    throw linkedError;
  }

  if (linkedClient) {
    const { data, error } = await serviceClient
      .from("clients")
      .update(clientValues)
      .eq("id", linkedClient.id)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  const { data, error } = await serviceClient
    .from("clients")
    .insert(clientValues)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const auth = await requireActiveAdmin(request);
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const payload = userUpsertSchema.parse(await request.json());
    const redirectTo =
      Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || undefined;

    let profile =
      payload.mode === "update" && payload.userId
        ? await waitForProfile(auth.serviceClient, payload.userId)
        : await findExistingProfile(auth.serviceClient, payload.email);

    let authUserId = profile?.id || payload.userId || null;
    let invited = false;

    if (!authUserId) {
      const inviteResponse = await auth.serviceClient.auth.admin.inviteUserByEmail(
        payload.email,
        {
          data: {
            full_name: payload.fullName,
            company_name: normalizeString(payload.companyName)
          },
          redirectTo
        }
      );

      if (inviteResponse.error || !inviteResponse.data.user) {
        throw inviteResponse.error || new Error("Unable to invite user.");
      }

      authUserId = inviteResponse.data.user.id;
      invited = true;
      profile = await waitForProfile(auth.serviceClient, authUserId);
    }

    if (!authUserId || !profile) {
      throw new Error("Profile creation did not complete in time.");
    }

    const adminUpdate = await auth.serviceClient.auth.admin.updateUserById(authUserId, {
      email: payload.email,
      user_metadata: {
        full_name: payload.fullName,
        company_name: normalizeString(payload.companyName)
      },
      app_metadata: {
        role: payload.role
      }
    });

    if (adminUpdate.error) {
      throw adminUpdate.error;
    }

    const profilePatch = {
      full_name: payload.fullName,
      email: payload.email,
      phone: normalizeString(payload.phone),
      role: payload.role,
      company_name: payload.role === "client" ? normalizeString(payload.companyName) : null
    };

    if (invited || payload.mode === "create" || payload.reactivate) {
      profilePatch.is_active = true;
      profilePatch.deactivated_at = null;
      profilePatch.deactivation_reason = null;
    }

    const { data: updatedProfile, error: profileError } = await auth.serviceClient
      .from("profiles")
      .update(profilePatch)
      .eq("id", authUserId)
      .select("*")
      .single();

    if (profileError) {
      throw profileError;
    }

    const clientId = await ensureClientLink(auth.serviceClient, payload, authUserId);

    return jsonResponse({
      userId: authUserId,
      profileId: updatedProfile.id,
      clientId,
      invited,
      message: invited ? "User invited successfully." : "User updated successfully."
    });
  } catch (error) {
    return jsonResponse(
      {
        message: error instanceof Error ? error.message : "Unable to manage user."
      },
      400
    );
  }
});
