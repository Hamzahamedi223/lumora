import "server-only";
import { Prisma, type OrderStatus, type PaymentMethod, type Coupon } from "@prisma/client";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { getSettings, readSettingsUncached, shippingFor } from "@/lib/settings";
import { MAX_QTY_PER_LINE, ORDER_STATUS_LABEL, ORDER_TRANSITIONS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { appUrl, ownerEmail, sendEmail } from "@/lib/email";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export type CartLine = { variantId: string; quantity: number };

/** Normalizes untrusted cart input: valid ids, integer quantities, merged duplicates, bounded size. */
export function normalizeLines(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  const map = new Map<string, number>();
  for (const l of lines.slice(0, 50)) {
    if (!l || typeof l !== "object") continue;
    const { variantId, quantity } = l as Record<string, unknown>;
    if (typeof variantId !== "string" || !/^[a-z0-9]{10,40}$/i.test(variantId)) continue;
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q) || q < 1) continue;
    map.set(variantId, Math.min(MAX_QTY_PER_LINE, (map.get(variantId) ?? 0) + q));
  }
  return [...map].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function couponDiscount(c: Pick<Coupon, "type" | "value">, subtotalMinor: number): number {
  const raw = c.type === "PERCENT" ? Math.round((subtotalMinor * Math.min(100, Math.max(0, c.value))) / 100) : c.value;
  return Math.max(0, Math.min(raw, subtotalMinor));
}

/** Returns the coupon if usable for this subtotal, else an error message. */
export async function checkCoupon(code: string, subtotalMinor: number, client: Prisma.TransactionClient = db) {
  const c = await client.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!c || !c.isActive) return { error: "Code promo invalide." } as const;
  if (c.startsAt && c.startsAt > now) return { error: "Ce code promo n'est pas encore actif." } as const;
  if (c.endsAt && c.endsAt < now) return { error: "Ce code promo a expiré." } as const;
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { error: "Ce code promo a atteint sa limite d'utilisation." } as const;
  if (subtotalMinor < c.minSubtotalMinor)
    return { error: `Ce code est valable dès ${formatPrice(c.minSubtotalMinor)} d'achat.` } as const;
  return { coupon: c } as const;
}

/** Server-side pricing of a cart: never trusts client prices or stock. */
export async function priceCart(rawLines: unknown, couponCode?: string | null, opts: { freshSettings?: boolean } = {}) {
  const lines = normalizeLines(rawLines);
  const variants = lines.length
    ? await db.variant.findMany({
        where: { id: { in: lines.map((l) => l.variantId) } },
        select: {
          id: true,
          name: true,
          stock: true,
          isActive: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              priceMinor: true,
              compareAtMinor: true,
              madeToOrder: true,
              leadTimeDays: true,
              images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      })
    : [];

  const issues: string[] = [];
  const items = [];
  for (const l of lines) {
    const v = variants.find((x) => x.id === l.variantId);
    if (!v || !v.isActive || v.product.status !== "ACTIVE") {
      issues.push("Un article de votre panier n'est plus disponible et a été retiré.");
      continue;
    }
    const available = v.product.madeToOrder ? MAX_QTY_PER_LINE : Math.max(0, v.stock);
    if (available === 0) {
      issues.push(`« ${v.product.name} — ${v.name} » est en rupture de stock.`);
      continue;
    }
    const quantity = Math.min(l.quantity, available);
    if (quantity < l.quantity) issues.push(`Quantité de « ${v.product.name} » ajustée au stock disponible (${available}).`);
    items.push({
      variantId: v.id,
      productId: v.product.id,
      slug: v.product.slug,
      name: v.product.name,
      variantName: v.name,
      image: v.product.images[0]?.url ?? null,
      madeToOrder: v.product.madeToOrder,
      leadTimeDays: v.product.leadTimeDays,
      unitPriceMinor: v.product.priceMinor,
      compareAtMinor: v.product.compareAtMinor,
      quantity,
      requested: l.quantity,
      available,
      lineTotalMinor: v.product.priceMinor * quantity,
    });
  }

  const subtotalMinor = items.reduce((s, i) => s + i.lineTotalMinor, 0);
  let discountMinor = 0;
  let coupon: { code: string; label: string } | null = null;
  let couponError: string | null = null;
  if (couponCode && couponCode.trim()) {
    const res = await checkCoupon(couponCode, subtotalMinor);
    if ("error" in res) couponError = res.error ?? null;
    else {
      discountMinor = couponDiscount(res.coupon, subtotalMinor);
      coupon = {
        code: res.coupon.code,
        label: res.coupon.type === "PERCENT" ? `-${res.coupon.value} %` : `-${formatPrice(res.coupon.value)}`,
      };
    }
  }
  const settings = opts.freshSettings ? await readSettingsUncached() : await getSettings();
  const shippingMinor = shippingFor(subtotalMinor - discountMinor, settings.shipping);
  return {
    items,
    issues,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    totalMinor: subtotalMinor - discountMinor + shippingMinor,
    coupon,
    couponError,
    freeShippingThresholdMinor: settings.shipping.freeThresholdMinor,
  };
}

export type PricedCart = Awaited<ReturnType<typeof priceCart>>;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  let r = "";
  for (let i = 0; i < 5; i++) r += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `LUM-${ymd}-${r}`;
}

export type CheckoutInput = {
  userId: string | null;
  lines: unknown;
  couponCode?: string | null;
  customer: { name: string; email: string; phone: string };
  address: { governorate: string; city: string; addressLine: string; postalCode?: string; notes?: string };
  paymentMethod: PaymentMethod;
};

export async function createOrder(input: CheckoutInput) {
  const settings = await readSettingsUncached();
  const allowed: Record<PaymentMethod, boolean> = {
    CASH_ON_DELIVERY: settings.payments.cod,
    BANK_TRANSFER: settings.payments.bankTransfer,
    D17: settings.payments.d17,
  };
  if (!allowed[input.paymentMethod]) throw new AppError("PAYMENT", "Ce mode de paiement n'est pas disponible.");

  const requested = normalizeLines(input.lines);
  const cart = await priceCart(requested, input.couponCode, { freshSettings: true });
  if (cart.items.length === 0) throw new AppError("EMPTY", "Votre panier est vide ou les articles ne sont plus disponibles.");
  // Refuse silently-changed carts: the customer must see the adjusted cart before paying.
  if (cart.items.length !== requested.length || cart.items.some((i) => i.quantity !== i.requested))
    throw new AppError("CHANGED", cart.issues[0] ?? "Votre panier a changé. Merci de le vérifier.");
  if (input.couponCode && cart.couponError) throw new AppError("COUPON", cart.couponError);

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = orderNumber();
    try {
      const order = await db.$transaction(async (tx) => {
        // Atomic stock decrement: the WHERE clause guarantees we never oversell, even with concurrent checkouts.
        for (const it of cart.items) {
          await tx.product.update({ where: { id: it.productId }, data: { salesCount: { increment: it.quantity } } });
          if (it.madeToOrder) continue;
          const n = await tx.$executeRaw(
            Prisma.sql`UPDATE variants SET stock = stock - ${it.quantity} WHERE id = ${it.variantId} AND "isActive" = true AND stock >= ${it.quantity}`,
          );
          if (n !== 1) throw new AppError("STOCK", `Stock insuffisant pour « ${it.name} — ${it.variantName} ». Merci de vérifier votre panier.`);
          await tx.stockMovement.create({ data: { variantId: it.variantId, delta: -it.quantity, reason: "ORDER", note: number } });
        }
        if (cart.coupon) {
          const n = await tx.$executeRaw(
            Prisma.sql`UPDATE coupons SET "usedCount" = "usedCount" + 1 WHERE code = ${cart.coupon.code} AND "isActive" = true AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`,
          );
          if (n !== 1) throw new AppError("COUPON", "Ce code promo n'est plus disponible.");
        }
        return tx.order.create({
          data: {
            number,
            userId: input.userId,
            paymentMethod: input.paymentMethod,
            customerName: input.customer.name,
            customerEmail: input.customer.email.toLowerCase(),
            customerPhone: input.customer.phone,
            governorate: input.address.governorate,
            city: input.address.city,
            addressLine: input.address.addressLine,
            postalCode: input.address.postalCode || null,
            notes: input.address.notes || null,
            subtotalMinor: cart.subtotalMinor,
            discountMinor: cart.discountMinor,
            shippingMinor: cart.shippingMinor,
            totalMinor: cart.totalMinor,
            couponCode: cart.coupon?.code ?? null,
            trackingToken: randomToken(18),
            items: {
              create: cart.items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                name: i.name,
                variantName: i.variantName,
                image: i.image,
                unitPriceMinor: i.unitPriceMinor,
                quantity: i.quantity,
                lineTotalMinor: i.lineTotalMinor,
                madeToOrder: i.madeToOrder,
              })),
            },
            events: { create: { status: "PENDING", note: "Commande passée", actor: "client" } },
          },
          include: { items: true },
        });
      });

      const link = `${appUrl()}/commande/confirmation/${order.number}?t=${order.trackingToken}`;
      await sendEmail(
        order.customerEmail,
        `Commande ${order.number} reçue`,
        [
          `Merci ${order.customerName} ! Nous avons bien reçu votre commande.`,
          ...order.items.map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ""} — ${formatPrice(i.lineTotalMinor)}`),
          `Total : ${formatPrice(order.totalMinor)} · ${PAYMENT_METHOD_LABEL[order.paymentMethod]}`,
          "Nous vous appellerons pour confirmer la livraison.",
        ],
        { label: "Suivre ma commande", url: link },
      );
      if (ownerEmail())
        await sendEmail(ownerEmail(), `Nouvelle commande ${order.number} — ${formatPrice(order.totalMinor)}`, [
          `${order.customerName} · ${order.customerPhone} · ${order.governorate}`,
        ], { label: "Ouvrir dans le tableau de bord", url: `${appUrl()}/admin/commandes/${order.number}` });
      return order;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // order number collision
      throw e;
    }
  }
  throw new AppError("RETRY", "Une erreur temporaire est survenue. Merci de réessayer.");
}

async function restock(tx: Prisma.TransactionClient, orderId: string, number: string, reason: "CANCEL_RESTOCK" | "RETURN_RESTOCK") {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (it.productId)
      await tx.$executeRaw(Prisma.sql`UPDATE products SET "salesCount" = GREATEST(0, "salesCount" - ${it.quantity}) WHERE id = ${it.productId}`);
    if (it.madeToOrder || !it.variantId) continue;
    const exists = await tx.variant.findUnique({ where: { id: it.variantId }, select: { id: true } });
    if (!exists) continue;
    await tx.variant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
    await tx.stockMovement.create({ data: { variantId: it.variantId, delta: it.quantity, reason, note: number } });
  }
}

const CUSTOMER_MESSAGE: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Votre commande est confirmée. Notre atelier la prépare avec soin.",
  SHIPPED: "Bonne nouvelle : votre commande est en route !",
  DELIVERED: "Votre commande a été livrée. Merci pour votre confiance — nous espérons qu'elle illuminera votre intérieur.",
  CANCELLED: "Votre commande a été annulée. Contactez-nous si vous avez une question.",
};

export async function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  actor: string,
  opts: { note?: string; restock?: boolean; trackingNumber?: string } = {},
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("NOT_FOUND", "Commande introuvable.");
  if (!ORDER_TRANSITIONS[order.status].includes(to))
    throw new AppError("TRANSITION", `Transition impossible : ${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[to]}.`);

  await db.$transaction(async (tx) => {
    // Guard against two admins changing the same order at once.
    const n = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: to,
        ...(to === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY" ? { paymentStatus: "PAID" as const } : {}),
        ...(opts.trackingNumber ? { trackingNumber: opts.trackingNumber } : {}),
      },
    });
    if (n.count !== 1) throw new AppError("CONFLICT", "La commande a été modifiée entre-temps. Rechargez la page.");
    if (to === "CANCELLED") await restock(tx, order.id, order.number, "CANCEL_RESTOCK");
    if (to === "RETURNED" && opts.restock) await restock(tx, order.id, order.number, "RETURN_RESTOCK");
    await tx.orderEvent.create({
      data: { orderId: order.id, status: to, note: opts.note?.trim() || `Statut : ${ORDER_STATUS_LABEL[to]}`, actor },
    });
  });

  const msg = CUSTOMER_MESSAGE[to];
  if (msg) {
    const lines = [msg];
    if (to === "SHIPPED" && opts.trackingNumber) lines.push(`Numéro de suivi : ${opts.trackingNumber}`);
    await sendEmail(order.customerEmail, `Commande ${order.number} : ${ORDER_STATUS_LABEL[to]}`, lines, {
      label: "Voir ma commande",
      url: `${appUrl()}/commande/confirmation/${order.number}?t=${order.trackingToken}`,
    });
  }
}

/** A customer may cancel their own order while it is still pending. */
export async function cancelOwnOrder(orderNumber: string, userId: string) {
  const order = await db.order.findFirst({ where: { number: orderNumber, userId } });
  if (!order) throw new AppError("NOT_FOUND", "Commande introuvable.");
  if (order.status !== "PENDING") throw new AppError("TRANSITION", "Cette commande ne peut plus être annulée en ligne. Contactez-nous.");
  await changeOrderStatus(order.id, "CANCELLED", "client", { note: "Annulée par le client" });
}
