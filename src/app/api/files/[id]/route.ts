import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readObject } from "@/lib/storage";

// Customer reference files: private, admins only, always downloaded (never rendered inline).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const file = await db.customRequestFile.findUnique({ where: { id } });
  if (!file) return new Response("Not found", { status: 404 });
  const data = await readObject("private", file.key);
  if (!data) return new Response("Not found", { status: 404 });
  const safeName = file.name.replace(/[^\w.\- ]/g, "_");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
