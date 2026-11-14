import { extname } from "node:path";
import { isSafeKey, MIME, readObject } from "@/lib/storage";

// Public images uploaded from the admin (local storage driver). Keys are random UUIDs, so they are cached forever.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const ext = extname(key).toLowerCase();
  if (!isSafeKey(key) || !MIME[ext] || !MIME[ext].startsWith("image/")) return new Response("Not found", { status: 404 });
  const data = await readObject("public", key);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
