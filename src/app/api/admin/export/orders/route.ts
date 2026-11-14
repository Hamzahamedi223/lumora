import type { OrderStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";

// Escapes CSV and neutralizes spreadsheet formula injection (=, +, -, @).
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const statut = new URL(req.url).searchParams.get("statut");
  const status = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).find((s) => s === statut);
  const orders = await db.order.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 10000, include: { items: true } });
  const head = ["Numéro", "Date", "Statut", "Paiement", "Mode", "Client", "E-mail", "Téléphone", "Gouvernorat", "Ville", "Adresse", "Articles", "Sous-total", "Remise", "Livraison", "Total", "Code promo"];
  const rows = orders.map((o) => [
    o.number,
    o.createdAt.toISOString(),
    ORDER_STATUS_LABEL[o.status],
    PAYMENT_STATUS_LABEL[o.paymentStatus],
    PAYMENT_METHOD_LABEL[o.paymentMethod],
    o.customerName,
    o.customerEmail,
    o.customerPhone,
    o.governorate,
    o.city,
    o.addressLine,
    o.items.map((i) => `${i.quantity}x ${i.name} (${i.variantName ?? ""})`).join(" | "),
    (o.subtotalMinor / 1000).toFixed(3),
    (o.discountMinor / 1000).toFixed(3),
    (o.shippingMinor / 1000).toFixed(3),
    (o.totalMinor / 1000).toFixed(3),
    o.couponCode ?? "",
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
