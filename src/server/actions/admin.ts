"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth";
import { SETTINGS_TAG, readSettingsUncached } from "@/lib/settings";
import { IMAGE_EXT, publicUrl, putObject, validateFile } from "@/lib/storage";
import { formValues, str, zodErrors, type ActionState } from "@/lib/action";
import { parsePrice, slugify } from "@/lib/format";
import { CATALOG_TAG } from "@/server/catalog";
import { AppError, changeOrderStatus } from "@/server/services/orders";
import { appUrl, sendEmail } from "@/lib/email";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";

/** Every admin action starts here: fails closed for anyone who isn't an admin. */
async function guard() {
  try {
    return await assertAdmin();
  } catch {
    throw new Error("Accès refusé.");
  }
}

function refreshCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

const fail = (e: unknown, fallback = "Une erreur est survenue."): ActionState => {
  if (e instanceof AppError) return { error: e.message };
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Cette valeur existe déjà (slug, code ou SKU en double)." };
  console.error("[admin]", e);
  return { error: fallback };
};

// ---------------------------------------------------------------- Orders

export async function orderStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard();
  const to = str(fd, "to") as OrderStatus;
  try {
    await changeOrderStatus(str(fd, "orderId"), to, admin.name, {
      note: str(fd, "note") || undefined,
      trackingNumber: str(fd, "trackingNumber").slice(0, 80) || undefined,
      restock: fd.get("restock") === "on",
    });
  } catch (e) {
    return fail(e);
  }
  if (to === "CANCELLED" || to === "RETURNED") updateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Statut mis à jour." };
}

export async function orderPaymentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard();
  const status = z.enum(["UNPAID", "PAID", "REFUNDED"]).safeParse(str(fd, "paymentStatus"));
  if (!status.success) return { error: "Statut invalide." };
  const id = str(fd, "orderId");
  await db.$transaction([
    db.order.update({ where: { id }, data: { paymentStatus: status.data } }),
    db.orderEvent.create({ data: { orderId: id, note: `Paiement : ${status.data === "PAID" ? "payée" : status.data === "REFUNDED" ? "remboursée" : "non payée"}`, actor: admin.name } }),
  ]);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Paiement mis à jour." };
}

export async function orderNoteAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  await db.order.update({ where: { id: str(fd, "orderId") }, data: { adminNote: str(fd, "adminNote").slice(0, 2000) || null } });
  revalidatePath("/admin/commandes", "layout");
  return { ok: true, message: "Note enregistrée." };
}

// ---------------------------------------------------------------- Products

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nom de variante requis.").max(40),
  colorHex: z.string().trim().regex(/^#[0-9a-f]{6}$/i, "Couleur invalide.").or(z.literal("")).optional(),
  sku: z.string().trim().max(60).optional(),
  stock: z.coerce.number().int().min(0, "Stock négatif impossible.").max(100000),
  /** Stock value when the form was loaded, so concurrent sales are preserved. */
  originalStock: z.coerce.number().int().optional(),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Nom requis.").max(120),
  slug: z.string().trim().max(80).optional(),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().min(10, "Description trop courte.").max(8000),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  material: z.string().trim().max(160).optional(),
  dimensions: z.string().trim().max(160).optional(),
  bulb: z.string().trim().max(160).optional(),
  weight: z.string().trim().max(60).optional(),
  leadTimeDays: z.string().trim().optional(),
});

const PRODUCT_FIELDS = ["name", "slug", "tagline", "description", "categoryId", "status", "material", "dimensions", "bulb", "weight", "leadTimeDays", "price", "compareAt"];

export async function saveProductAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const values = formValues(fd, PRODUCT_FIELDS);
  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  const fieldErrors: Record<string, string> = parsed.success ? {} : zodErrors(parsed.error);
  const price = parsePrice(str(fd, "price"));
  const compareAt = str(fd, "compareAt") ? parsePrice(str(fd, "compareAt")) : null;
  if (price == null || price <= 0) fieldErrors.price = "Prix invalide (ex. 129 ou 129,500).";
  if (str(fd, "compareAt") && compareAt == null) fieldErrors.compareAt = "Prix barré invalide.";
  if (compareAt != null && price != null && compareAt <= price) fieldErrors.compareAt = "Le prix barré doit être supérieur au prix.";
  const lead = str(fd, "leadTimeDays");
  if (lead && !/^\d{1,3}$/.test(lead)) fieldErrors.leadTimeDays = "Nombre de jours invalide.";

  let variants: z.infer<typeof variantSchema>[] = [];
  try {
    const v = z.array(variantSchema).min(1, "Au moins une variante est requise.").max(30).safeParse(JSON.parse(str(fd, "variants") || "[]"));
    if (!v.success) fieldErrors.variants = v.error.issues[0].message;
    else variants = v.data;
  } catch {
    fieldErrors.variants = "Variantes invalides.";
  }
  let keepImages: { id: string; alt: string }[] = [];
  try {
    keepImages = z.array(z.object({ id: z.string(), alt: z.string().max(160) })).parse(JSON.parse(str(fd, "images") || "[]"));
  } catch {
    return { error: "Images invalides.", values };
  }
  const uploads = fd.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length > 10) fieldErrors.newImages = "10 images maximum par envoi.";
  for (const f of uploads) {
    const err = await validateFile(f, IMAGE_EXT, 8);
    if (err) fieldErrors.newImages = err;
  }
  if (!parsed.success || Object.keys(fieldErrors).length) return { error: "Merci de corriger les champs indiqués.", fieldErrors, values };

  const d = parsed.data;
  const id = str(fd, "id") || null;
  const slug = slugify(d.slug || d.name);
  if (!slug) return { error: "Slug invalide.", fieldErrors: { slug: "Slug invalide." }, values };
  const madeToOrder = fd.get("madeToOrder") === "on";
  const data = {
    name: d.name,
    slug,
    tagline: d.tagline || null,
    description: d.description,
    categoryId: d.categoryId || null,
    status: d.status,
    priceMinor: price!,
    compareAtMinor: compareAt,
    featured: fd.get("featured") === "on",
    isNew: fd.get("isNew") === "on",
    madeToOrder,
    leadTimeDays: lead ? Number(lead) : null,
    material: d.material || null,
    dimensions: d.dimensions || null,
    bulb: d.bulb || null,
    weight: d.weight || null,
  };

  let productId: string;
  try {
    const stored: string[] = [];
    for (const f of uploads) stored.push(publicUrl(await putObject("public", f, "products")));

    productId = await db.$transaction(async (tx) => {
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
      // Images: keep the listed ones in the given order, delete the others, append uploads.
      await tx.productImage.deleteMany({ where: { productId: product.id, id: { notIn: keepImages.map((i) => i.id) } } });
      for (const [i, img] of keepImages.entries())
        await tx.productImage.updateMany({ where: { id: img.id, productId: product.id }, data: { sortOrder: i, alt: img.alt || null } });
      for (const [i, url] of stored.entries())
        await tx.productImage.create({ data: { productId: product.id, url, alt: d.name, sortOrder: keepImages.length + i } });

      // Variants: update existing (recording stock changes), create new, deactivate removed ones that have orders.
      const existing = await tx.variant.findMany({ where: { productId: product.id } });
      const sent = new Set(variants.filter((v) => v.id).map((v) => v.id));
      for (const old of existing.filter((e) => !sent.has(e.id))) {
        const used = await tx.orderItem.count({ where: { variantId: old.id } });
        if (used) await tx.variant.update({ where: { id: old.id }, data: { isActive: false } });
        else await tx.variant.delete({ where: { id: old.id } });
      }
      for (const [i, v] of variants.entries()) {
        const fields = { name: v.name, colorHex: v.colorHex || null, sku: v.sku || null, isActive: v.isActive, sortOrder: i };
        const old = v.id ? existing.find((e) => e.id === v.id) : undefined;
        if (old) {
          // Apply the admin's change as a difference, so a sale made while the form was open is not overwritten.
          let delta = v.stock - (v.originalStock ?? old.stock);
          if (old.stock + delta < 0) delta = -old.stock;
          await tx.variant.update({ where: { id: old.id }, data: { ...fields, stock: { increment: delta } } });
          if (delta) await tx.stockMovement.create({ data: { variantId: old.id, delta, reason: "ADJUSTMENT", note: "Fiche produit" } });
        } else {
          const nv = await tx.variant.create({ data: { ...fields, productId: product.id, stock: v.stock } });
          if (v.stock) await tx.stockMovement.create({ data: { variantId: nv.id, delta: v.stock, reason: "ADJUSTMENT", note: "Stock initial" } });
        }
      }
      return product.id;
    });
  } catch (e) {
    return { ...fail(e, "Impossible d'enregistrer le produit."), values };
  }
  refreshCatalog();
  if (!id) redirect(`/admin/produits/${productId}?created=1`);
  return { ok: true, message: "Produit enregistré.", nonce: Date.now() };
}

export async function deleteProductAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const id = str(fd, "id");
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    refreshCatalog();
    redirect("/admin/produits?archived=1");
  }
  await db.product.delete({ where: { id } });
  refreshCatalog();
  redirect("/admin/produits");
}

export async function adjustStockAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const variantId = str(fd, "variantId");
  const target = Number(str(fd, "stock"));
  if (!Number.isInteger(target) || target < 0 || target > 100000) return { error: "Stock invalide." };
  try {
    await db.$transaction(async (tx) => {
      const v = await tx.variant.findUniqueOrThrow({ where: { id: variantId } });
      const delta = target - v.stock;
      if (!delta) return;
      await tx.variant.update({ where: { id: variantId }, data: { stock: { increment: delta } } });
      await tx.stockMovement.create({ data: { variantId, delta, reason: "ADJUSTMENT", note: str(fd, "note").slice(0, 120) || "Ajustement manuel" } });
    });
  } catch (e) {
    return fail(e);
  }
  refreshCatalog();
  return { ok: true, message: "Stock mis à jour." };
}

// ---------------------------------------------------------------- Categories

export async function saveCategoryAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const values = formValues(fd, ["name", "slug", "description", "sortOrder"]);
  const name = str(fd, "name");
  if (name.length < 2) return { fieldErrors: { name: "Nom requis." }, values };
  const slug = slugify(str(fd, "slug") || name);
  const id = str(fd, "id");
  let image: string | undefined;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const err = await validateFile(file, IMAGE_EXT, 8);
    if (err) return { fieldErrors: { image: err }, values };
    image = publicUrl(await putObject("public", file, "categories"));
  }
  const data = {
    name,
    slug,
    description: str(fd, "description").slice(0, 300) || null,
    sortOrder: Number(str(fd, "sortOrder")) || 0,
    isActive: fd.get("isActive") === "on",
    ...(image ? { image } : {}),
  };
  try {
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
  } catch (e) {
    return { ...fail(e), values };
  }
  refreshCatalog();
  return { ok: true, message: id ? "Catégorie mise à jour." : "Catégorie créée.", nonce: Date.now() };
}

export async function deleteCategoryAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  await db.category.delete({ where: { id: str(fd, "id") } }); // products keep existing (categoryId set null)
  refreshCatalog();
  return { ok: true, message: "Catégorie supprimée." };
}

// ---------------------------------------------------------------- Custom requests

export async function updateRequestAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const status = z.enum(["NEW", "REVIEWING", "QUOTED", "ACCEPTED", "IN_PRODUCTION", "COMPLETED", "CANCELLED"]).safeParse(str(fd, "status"));
  if (!status.success) return { error: "Statut invalide." };
  const quoteRaw = str(fd, "quote");
  const quote = quoteRaw ? parsePrice(quoteRaw) : null;
  if (quoteRaw && quote == null) return { fieldErrors: { quote: "Montant invalide." } };
  const id = str(fd, "id");
  const before = await db.customRequest.findUnique({ where: { id } });
  if (!before) return { error: "Demande introuvable." };
  const r = await db.customRequest.update({ where: { id }, data: { status: status.data, quoteMinor: quote, adminNote: str(fd, "adminNote").slice(0, 4000) || null } });
  if (fd.get("notify") === "on" && before.status !== r.status) {
    await sendEmail(r.email, `Votre demande ${r.number} : ${REQUEST_STATUS_LABEL[r.status]}`, [
      `Bonjour ${r.name}, le statut de votre demande sur mesure a évolué : ${REQUEST_STATUS_LABEL[r.status]}.`,
      ...(r.quoteMinor != null && r.status === "QUOTED" ? [`Montant du devis : ${(r.quoteMinor / 1000).toFixed(3)} DT. Nous vous contacterons pour le détail.`] : []),
    ], { label: "Nous contacter", url: `${appUrl()}/contact` });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Demande mise à jour." };
}

// ---------------------------------------------------------------- Coupons

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3 à 30 caractères : lettres, chiffres, - ou _."),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.string().trim(),
  minSubtotal: z.string().trim().optional(),
  maxUses: z.string().trim().optional(),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
});

export async function saveCouponAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const values = formValues(fd, ["code", "type", "value", "minSubtotal", "maxUses", "startsAt", "endsAt"]);
  const parsed = couponSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodErrors(parsed.error), values };
  const d = parsed.data;
  const fieldErrors: Record<string, string> = {};
  let value: number | null;
  if (d.type === "PERCENT") {
    value = /^\d{1,3}$/.test(d.value) ? Number(d.value) : null;
    if (value == null || value < 1 || value > 100) fieldErrors.value = "Pourcentage entre 1 et 100.";
  } else {
    value = parsePrice(d.value);
    if (!value) fieldErrors.value = "Montant invalide.";
  }
  const min = d.minSubtotal ? parsePrice(d.minSubtotal) : 0;
  if (min == null) fieldErrors.minSubtotal = "Montant invalide.";
  const maxUses = d.maxUses ? Number(d.maxUses) : null;
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) fieldErrors.maxUses = "Nombre invalide.";
  const startsAt = d.startsAt ? new Date(`${d.startsAt}T00:00:00+01:00`) : null;
  const endsAt = d.endsAt ? new Date(`${d.endsAt}T23:59:59+01:00`) : null;
  if (startsAt && endsAt && endsAt < startsAt) fieldErrors.endsAt = "La fin doit être après le début.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  const id = str(fd, "id");
  const data = { code: d.code, type: d.type, value: value!, minSubtotalMinor: min ?? 0, maxUses, startsAt, endsAt };
  try {
    if (id) await db.coupon.update({ where: { id }, data });
    else await db.coupon.create({ data });
  } catch (e) {
    return { ...fail(e), values };
  }
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Code promo enregistré.", nonce: Date.now() };
}

export async function toggleCouponAction(fd: FormData) {
  await guard();
  const c = await db.coupon.findUnique({ where: { id: str(fd, "id") } });
  if (c) await db.coupon.update({ where: { id: c.id }, data: { isActive: !c.isActive } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(fd: FormData) {
  await guard();
  await db.coupon.deleteMany({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/coupons");
}

// ---------------------------------------------------------------- Reviews, messages, customers

export async function moderateReviewAction(fd: FormData) {
  await guard();
  const status = z.enum(["APPROVED", "REJECTED", "PENDING"]).parse(str(fd, "status"));
  await db.review.update({ where: { id: str(fd, "id") }, data: { status } });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
}

export async function deleteReviewAction(fd: FormData) {
  await guard();
  await db.review.deleteMany({ where: { id: str(fd, "id") } });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
}

export async function messageReadAction(fd: FormData) {
  await guard();
  await db.contactMessage.update({ where: { id: str(fd, "id") }, data: { isRead: str(fd, "read") === "1" } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessageAction(fd: FormData) {
  await guard();
  await db.contactMessage.deleteMany({ where: { id: str(fd, "id") } });
  revalidatePath("/admin", "layout");
}

export async function toggleUserStatusAction(fd: FormData) {
  const admin = await guard();
  const id = str(fd, "id");
  if (id === admin.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u || u.role === "ADMIN") return;
  const status = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id }, data: { status } });
  if (status === "SUSPENDED") await db.session.deleteMany({ where: { userId: id } });
  revalidatePath("/admin/clients", "layout");
}

// ---------------------------------------------------------------- Settings

export async function saveSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard();
  const current = await readSettingsUncached();
  const fee = parsePrice(str(fd, "feeMinor"));
  const threshold = str(fd, "freeThresholdMinor") ? parsePrice(str(fd, "freeThresholdMinor")) : 0;
  const fieldErrors: Record<string, string> = {};
  if (fee == null) fieldErrors.feeMinor = "Montant invalide.";
  if (threshold == null) fieldErrors.freeThresholdMinor = "Montant invalide.";
  const email = str(fd, "email");
  if (email && !z.email().safeParse(email).success) fieldErrors.email = "E-mail invalide.";
  for (const k of ["instagram", "facebook", "tiktok"]) {
    const v = str(fd, k);
    if (v && !/^https:\/\/[^\s]+$/.test(v)) fieldErrors[k] = "Lien https:// requis.";
  }
  const payments = { cod: fd.get("cod") === "on", bankTransfer: fd.get("bankTransfer") === "on", d17: fd.get("d17") === "on" };
  if (!payments.cod && !payments.bankTransfer && !payments.d17) fieldErrors.payments = "Activez au moins un mode de paiement.";
  if (Object.keys(fieldErrors).length) return { error: "Merci de corriger les champs indiqués.", fieldErrors };
  const t = (k: string, max = 300) => str(fd, k).slice(0, max);
  const value = {
    store: {
      ...current.store,
      name: t("name", 60) || current.store.name,
      tagline: t("tagline"),
      email,
      phone: t("phone", 40),
      whatsapp: t("whatsapp", 20).replace(/\D/g, ""),
      address: t("address"),
      instagram: t("instagram"),
      facebook: t("facebook"),
      tiktok: t("tiktok"),
      announcement: t("announcement", 160),
      heroTitle: t("heroTitle", 120) || current.store.heroTitle,
      heroSubtitle: t("heroSubtitle", 400) || current.store.heroSubtitle,
    },
    shipping: { feeMinor: fee!, freeThresholdMinor: threshold!, deliveryDays: t("deliveryDays", 60) || current.shipping.deliveryDays },
    payments: { ...payments, bankDetails: t("bankDetails", 600), d17Number: t("d17Number", 40) },
  };
  await db.setting.upsert({ where: { key: "store" }, update: { value }, create: { key: "store", value } });
  updateTag(SETTINGS_TAG);
  refreshCatalog();
  return { ok: true, message: "Paramètres enregistrés." };
}
