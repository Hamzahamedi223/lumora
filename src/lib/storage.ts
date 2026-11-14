import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Two buckets:
 *  - "public": product / category images, served via /api/media/<key> (local) or the Supabase public URL
 *  - "private": customer reference files, only served to admins via /api/files/<id>
 * STORAGE_DRIVER=local writes to ./storage (development / VPS). STORAGE_DRIVER=supabase uses Supabase Storage.
 */
export type Bucket = "public" | "private";

const driver = process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local";
const ROOT = resolve(process.cwd(), "storage");
const bucketName = (b: Bucket) =>
  b === "public" ? process.env.SUPABASE_PUBLIC_BUCKET || "public-assets" : process.env.SUPABASE_PRIVATE_BUCKET || "private-files";

/**
 * Server-only Supabase credentials. Accepts the new secret key (`sb_secret_…`, sent as `apikey`)
 * or a legacy service_role JWT (also sent as a Bearer token). Never expose it to the browser.
 */
function authHeaders(): Record<string, string> {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) throw new Error("STORAGE_KEY_MISSING");
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

export function isSafeKey(key: string) {
  return /^[a-z0-9/_.-]+$/i.test(key) && !key.includes("..") && !key.startsWith("/");
}

export const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".stl": "model/stl",
  ".obj": "text/plain",
  ".3mf": "model/3mf",
};

export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
export const REFERENCE_EXT = [...IMAGE_EXT, ".pdf", ".stl", ".obj", ".3mf"];

// Magic numbers so a renamed file cannot pass as an image.
function looksLike(ext: string, buf: Buffer): boolean {
  const hex = buf.subarray(0, 12).toString("hex");
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return hex.startsWith("ffd8ff");
    case ".png":
      return hex.startsWith("89504e47");
    case ".webp":
      return buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    case ".avif":
      return buf.subarray(4, 8).toString() === "ftyp";
    case ".gif":
      return buf.subarray(0, 3).toString() === "GIF";
    case ".pdf":
      return buf.subarray(0, 4).toString() === "%PDF";
    default:
      return true; // 3D formats vary (ASCII or binary STL, OBJ text, 3MF zip)
  }
}

export async function validateFile(file: File, allowedExt: string[], maxMb: number): Promise<string | null> {
  if (!file || file.size === 0) return "Fichier vide.";
  const ext = extname(file.name).toLowerCase();
  if (!allowedExt.includes(ext)) return `Format non autorisé (${ext || "?"}). Formats acceptés : ${allowedExt.join(", ")}`;
  if (file.size > maxMb * 1024 * 1024) return `« ${file.name} » est trop volumineux (max ${maxMb} Mo).`;
  const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
  if (!looksLike(ext, head)) return `« ${file.name} » ne correspond pas à son format.`;
  return null;
}

export async function putObject(bucket: Bucket, file: File, prefix: string): Promise<string> {
  const ext = extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const key = `${prefix}/${randomUUID()}${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  if (driver === "supabase") {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucketName(bucket)}/${key}`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "31536000",
      },
      body,
    });
    if (!res.ok) throw new Error(`UPLOAD_FAILED ${res.status}`);
  } else {
    const path = join(ROOT, bucket, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }
  return key;
}

export async function readObject(bucket: Bucket, key: string): Promise<Buffer | null> {
  if (!isSafeKey(key)) return null;
  if (driver === "supabase") {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucketName(bucket)}/${key}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await readFile(join(ROOT, bucket, key));
  } catch {
    return null;
  }
}

/** URL stored in the DB for a public object. */
export function publicUrl(key: string): string {
  if (driver === "supabase")
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName("public")}/${key}`;
  return `/api/media/${key}`;
}
