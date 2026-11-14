import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "lumora_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === hash.length && timingSafeEqual(hash, expected);
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, phone: true, role: true, status: true, createdAt: true } },
    },
  });
  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next = "/compte"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** For server actions: throws instead of redirecting so actions fail closed. */
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: unknown, fallback = "/compte"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
