import "server-only";
import { headers } from "next/headers";

// Fixed-window limiter, per server instance. For several instances, swap the Map for Redis (e.g. Upstash).
const hits = new Map<string, { n: number; reset: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const e = hits.get(key);
  if (!e || e.reset < now) {
    hits.set(key, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  e.n += 1;
  return e.n <= limit;
}
