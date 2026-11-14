"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl, ownerEmail, sendEmail } from "@/lib/email";
import { putObject, REFERENCE_EXT, validateFile } from "@/lib/storage";
import { formValues, str, zodErrors, type ActionState } from "@/lib/action";
import { emailSchema, governorateSchema, nameSchema, optionalText, phoneSchema } from "@/lib/validation";
import { AppError, createOrder, priceCart } from "@/server/services/orders";
import { REQUEST_TYPE_LABEL } from "@/lib/constants";

/** Live cart pricing for the drawer, cart page and checkout. */
export async function priceCartAction(lines: unknown, coupon?: string) {
  if (!(await rateLimit("cart", 120, 60))) throw new Error("Trop de requêtes.");
  const cart = await priceCart(lines, typeof coupon === "string" ? coupon.slice(0, 40) : null);
  return cart;
}

const checkoutSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  governorate: governorateSchema,
  city: z.string().trim().min(2, "Ville requise.").max(80),
  addressLine: z.string().trim().min(5, "Adresse trop courte.").max(200),
  postalCode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}$/.test(v), "Code postal à 4 chiffres.")
    .optional(),
  notes: optionalText(500),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "D17"], "Choisissez un mode de paiement."),
  terms: z.literal("on", "Vous devez accepter les conditions générales de vente."),
});

const CHECKOUT_FIELDS = ["name", "email", "phone", "governorate", "city", "addressLine", "postalCode", "notes", "paymentMethod"];

export async function placeOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, CHECKOUT_FIELDS);
  if (!(await rateLimit("checkout", 8, 600))) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values };
  const parsed = checkoutSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodErrors(parsed.error), values };
  let lines: unknown;
  try {
    lines = JSON.parse(str(fd, "cart") || "[]");
  } catch {
    return { error: "Panier invalide.", values };
  }
  const user = await getCurrentUser();
  let target: string;
  try {
    const d = parsed.data;
    const order = await createOrder({
      userId: user?.id ?? null,
      lines,
      couponCode: str(fd, "coupon") || null,
      customer: { name: d.name, email: d.email, phone: d.phone },
      address: { governorate: d.governorate, city: d.city, addressLine: d.addressLine, postalCode: d.postalCode, notes: d.notes },
      paymentMethod: d.paymentMethod,
    });
    updateTag(CATALOG_TAG); // stock changed
    target = `/commande/confirmation/${order.number}?t=${order.trackingToken}&new=1`;
  } catch (e) {
    if (e instanceof AppError) return { error: e.message, values };
    console.error("[checkout]", e);
    return { error: "Une erreur est survenue. Votre commande n'a pas été enregistrée, merci de réessayer.", values };
  }
  redirect(target);
}

export async function subscribeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit("newsletter", 5, 600))) return { error: "Trop de tentatives." };
  const parsed = emailSchema.safeParse(str(fd, "email"));
  if (!parsed.success) return { error: "Adresse e-mail invalide." };
  await db.subscriber.upsert({ where: { email: parsed.data }, update: {}, create: { email: parsed.data } });
  return { ok: true, message: "Merci ! Vous serez les premiers informés de nos nouvelles collections." };
}

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  subject: z.string().trim().min(3, "Sujet trop court.").max(120),
  message: z.string().trim().min(10, "Message trop court (10 caractères minimum).").max(4000),
});

export async function contactAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "email", "phone", "subject", "message"]);
  if (str(fd, "website")) return { ok: true, message: "Merci, votre message a bien été envoyé." }; // honeypot
  if (!(await rateLimit("contact", 5, 600))) return { error: "Trop de messages envoyés. Réessayez plus tard.", values };
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodErrors(parsed.error), values };
  const d = parsed.data;
  await db.contactMessage.create({ data: { name: d.name, email: d.email, phone: d.phone || null, subject: d.subject, message: d.message } });
  if (ownerEmail()) await sendEmail(ownerEmail(), `Message : ${d.subject}`, [`De ${d.name} <${d.email}>`, d.message], { label: "Répondre", url: `${appUrl()}/admin/messages` });
  return { ok: true, message: "Merci, votre message a bien été envoyé. Nous vous répondons sous 24 h ouvrées.", nonce: Date.now() };
}

const requestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  type: z.enum(["LAMP", "WALL_ART", "OTHER"], "Choisissez un type de projet."),
  description: z.string().trim().min(20, "Décrivez votre projet en quelques phrases (20 caractères minimum).").max(4000),
  dimensions: optionalText(120),
  colors: optionalText(120),
  budget: optionalText(60),
  deadline: optionalText(60),
});

export async function customRequestAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "email", "phone", "type", "description", "dimensions", "colors", "budget", "deadline"]);
  if (str(fd, "website")) return { ok: true, message: "Merci !" };
  if (!(await rateLimit("custom", 4, 900))) return { error: "Trop de demandes envoyées. Réessayez plus tard.", values };
  const parsed = requestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodErrors(parsed.error), values };

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 5) return { error: "5 fichiers maximum.", values };
  for (const f of files) {
    const err = await validateFile(f, REFERENCE_EXT, 10);
    if (err) return { error: err, fieldErrors: { files: err }, values };
  }
  const user = await getCurrentUser();
  const d = parsed.data;
  const stored = [];
  try {
    for (const f of files) stored.push({ key: await putObject("private", f, "requests"), name: f.name.slice(0, 120), size: f.size, mime: f.type || "application/octet-stream" });
  } catch (e) {
    console.error("[upload]", e);
    return { error: "L'envoi des fichiers a échoué. Réessayez ou envoyez la demande sans fichier.", values };
  }
  const number = `SM-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  await db.customRequest.create({
    data: {
      number,
      userId: user?.id ?? null,
      name: d.name,
      email: d.email,
      phone: d.phone,
      type: d.type,
      description: d.description,
      dimensions: d.dimensions,
      colors: d.colors,
      budget: d.budget,
      deadline: d.deadline,
      files: { create: stored },
    },
  });
  await sendEmail(d.email, `Demande sur mesure ${number} reçue`, [
    `Bonjour ${d.name}, merci pour votre demande (${REQUEST_TYPE_LABEL[d.type]}).`,
    "Notre atelier l'étudie et revient vers vous sous 48 h avec une proposition et un devis.",
  ]);
  if (ownerEmail()) await sendEmail(ownerEmail(), `Nouvelle demande sur mesure ${number}`, [`${d.name} · ${d.phone}`, d.description], { label: "Voir la demande", url: `${appUrl()}/admin/sur-mesure/${number}` });
  return { ok: true, message: `Merci ! Votre demande ${number} a bien été envoyée. Nous vous répondons sous 48 h.`, nonce: Date.now() };
}

const reviewSchema = z.object({
  productId: z.string().min(10).max(40),
  name: nameSchema,
  rating: z.coerce.number().int().min(1, "Choisissez une note.").max(5),
  body: z.string().trim().min(10, "Votre avis est trop court (10 caractères minimum).").max(2000),
});

export async function reviewAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["name", "body", "rating"]);
  if (!(await rateLimit("review", 3, 900))) return { error: "Trop d'avis envoyés. Réessayez plus tard.", values };
  const parsed = reviewSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodErrors(parsed.error), values };
  const product = await db.product.findFirst({ where: { id: parsed.data.productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return { error: "Produit introuvable." };
  const user = await getCurrentUser();
  await db.review.create({ data: { ...parsed.data, userId: user?.id ?? null } });
  return { ok: true, message: "Merci pour votre avis ! Il sera publié après vérification.", nonce: Date.now() };
}

export async function trackOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd, ["number", "contact"]);
  if (!(await rateLimit("track", 10, 300))) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values };
  const number = str(fd, "number").toUpperCase();
  const contact = str(fd, "contact").toLowerCase();
  if (!number || !contact) return { error: "Renseignez le numéro de commande et votre e-mail ou téléphone.", values };
  const order = await db.order.findUnique({ where: { number }, select: { number: true, trackingToken: true, customerEmail: true, customerPhone: true } });
  const digits = (s: string) => s.replace(/\D/g, "").slice(-8);
  const matches = order && (order.customerEmail === contact || (digits(contact).length === 8 && digits(order.customerPhone) === digits(contact)));
  if (!order || !matches) return { error: "Aucune commande ne correspond à ces informations.", values };
  redirect(`/commande/confirmation/${order.number}?t=${order.trackingToken}`);
}
