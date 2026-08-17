import { requireSupabase } from "./supabase";

function sanitizeFilename(name = "file") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function makePath(prefix, file) {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : "bin";
  const base = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
  return `${prefix}/${crypto.randomUUID()}-${base}.${extension}`;
}

export async function uploadPublicFile(bucket, prefix, file) {
  const client = requireSupabase();
  const path = makePath(prefix, file);
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl }
  } = client.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl };
}

export async function uploadPrivateFile(bucket, prefix, file) {
  const client = requireSupabase();
  const path = makePath(prefix, file);
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw error;
  }

  return { path };
}

export async function createSignedFileUrl(bucket, path, expiresIn = 3600) {
  if (!path) {
    return "";
  }

  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function isRemoteFileUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

export async function resolveStoredFileUrl(bucket, stored, expiresIn = 3600) {
  if (!stored) {
    return "";
  }

  if (isRemoteFileUrl(stored)) {
    return stored;
  }

  return createSignedFileUrl(bucket, stored, expiresIn);
}
