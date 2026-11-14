"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  randomToken,
  requireUser,
  safeNext,
  sha256,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl, sendEmail } from "@/lib/email";
import { formValues, str, zodErrors, type ActionState } from "@/lib/action";
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from "@/lib/validation";
import { AppError, cancelOwnOrder } from "@/server/services/orders";

// A real hash so unknown e-mails take as long as wrong passwords (no account enumeration by timing).
const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const values = { email };
  if (!(await rateLimit("login", 10, 600))) return { error: "Trop de tentatives. Réessayez dans 10 minutes.", values };
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const ok = await verifyPassword(str(fd, "password") || "x", user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "E-mail ou mot de passe incorrect.", values };
  if (user.status !== "ACTIVE") return { error: "Ce compte est suspendu. Contactez-nous.", values };
  await createSession(user.id);
  redirect(safeNext(str(fd, "next"), user.role === "ADMIN" ? "/admin" : "/compte"));
}

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  password: passwordSchema,
});

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "email", "phone"]);
  if (!(await rateLimit("register", 5, 600))) return { error: "Trop de tentatives. Réessayez plus tard.", values };
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodErrors(parsed.error), values };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } }))
    return { error: "Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.", values };
  const user = await db.user.create({
    data: { name: d.name, email: d.email, phone: d.phone || null, passwordHash: await hashPassword(d.password) },
  });
  // Attach previous guest orders placed with the same e-mail.
  await db.order.updateMany({ where: { customerEmail: d.email, userId: null }, data: { userId: user.id } });
  await createSession(user.id);
  await sendEmail(d.email, "Bienvenue chez Lumora", [`Bonjour ${d.name}, votre compte est créé.`, "Suivez vos commandes et vos demandes sur mesure depuis votre espace client."], {
    label: "Mon espace",
    url: `${appUrl()}/compte`,
  });
  redirect(safeNext(str(fd, "next"), "/compte"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const generic: ActionState = { ok: true, message: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé." };
  if (!(await rateLimit("forgot", 5, 900))) return { error: "Trop de demandes. Réessayez plus tard." };
  const parsed = emailSchema.safeParse(str(fd, "email"));
  if (!parsed.success) return { error: "Adresse e-mail invalide.", values: { email: str(fd, "email") } };
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (!user || user.status !== "ACTIVE") return generic;
  const token = randomToken();
  await db.passwordReset.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) } });
  await sendEmail(user.email, "Réinitialisation de votre mot de passe", ["Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure."], {
    label: "Choisir un nouveau mot de passe",
    url: `${appUrl()}/reinitialiser-mot-de-passe?token=${token}`,
  });
  return generic;
}

export async function resetPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit("reset", 10, 900))) return { error: "Trop de tentatives." };
  const token = str(fd, "token");
  const pw = passwordSchema.safeParse(fd.get("password"));
  if (!pw.success) return { fieldErrors: { password: pw.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { fieldErrors: { confirm: "Les mots de passe ne correspondent pas." } };
  const row = token ? await db.passwordReset.findUnique({ where: { tokenHash: sha256(token) } }) : null;
  if (!row || row.usedAt || row.expiresAt < new Date()) return { error: "Ce lien est invalide ou a expiré. Faites une nouvelle demande." };
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await hashPassword(pw.data) } }),
    db.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  await createSession(row.userId);
  redirect("/compte");
}

const profileSchema = z.object({ name: nameSchema, phone: z.union([z.literal(""), phoneSchema]).optional() });

export async function updateProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodErrors(parsed.error), values: formValues(fd, ["name", "phone"]) };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/compte", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!(await rateLimit("change-pw", 10, 900))) return { error: "Trop de tentatives." };
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(str(fd, "current") || "x", row.passwordHash))) return { fieldErrors: { current: "Mot de passe actuel incorrect." } };
  const pw = passwordSchema.safeParse(fd.get("password"));
  if (!pw.success) return { fieldErrors: { password: pw.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { fieldErrors: { confirm: "Les mots de passe ne correspondent pas." } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw.data) } });
  // Sign out other devices, keep this session.
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return { ok: true, message: "Mot de passe modifié. Vos autres appareils ont été déconnectés.", nonce: Date.now() };
}

export async function cancelOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    await cancelOwnOrder(str(fd, "number"), user.id);
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
  updateTag(CATALOG_TAG); // stock restored
  revalidatePath("/compte", "layout");
  return { ok: true, message: "Commande annulée." };
}
