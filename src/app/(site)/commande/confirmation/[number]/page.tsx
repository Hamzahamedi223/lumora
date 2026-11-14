import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { Badge, ButtonLink, Container } from "@/components/ui";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { ClearCart } from "./clear-cart";

export const metadata: Metadata = { title: "Votre commande", robots: { index: false } };

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ t?: string; new?: string }>;
}) {
  const [{ number }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const order = await db.order.findUnique({ where: { number }, include: { items: true, events: { orderBy: { createdAt: "asc" } } } });
  // Access: secret tracking token from the link, the owner's account, or an admin.
  const allowed = order && ((sp.t && same(sp.t, order.trackingToken)) || (user && (user.id === order.userId || user.role === "ADMIN")));
  if (!order || !allowed) notFound();
  const settings = await getSettings();
  const isNew = sp.new === "1";

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      {isNew ? <ClearCart /> : null}
      <div className="text-center">
        {isNew ? (
          <>
            <div className="lamp-glow mx-auto mb-4 grid size-24 place-items-center rounded-full">
              <span className="grid size-14 place-items-center rounded-full bg-accent text-2xl text-accent-ink">✓</span>
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Merci {order.customerName.split(" ")[0]} !</h1>
            <p className="mt-3 text-muted">Votre commande est enregistrée. Un e-mail de confirmation a été envoyé à {order.customerEmail}.</p>
          </>
        ) : (
          <h1 className="font-display text-4xl font-light tracking-tight">Suivi de commande</h1>
        )}
        <p className="mt-4 text-sm text-muted">
          Commande <span className="font-semibold text-fg">{order.number}</span> · {formatDate(order.createdAt, true)}
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="rounded-3xl border border-border bg-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-medium">Statut</h2>
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          </div>
          <OrderTimeline status={order.status} events={order.events.map((e) => ({ status: e.status, createdAt: e.createdAt.toISOString() }))} />
          {order.trackingNumber ? <p className="mt-6 text-sm text-muted">N° de suivi transporteur : <span className="font-semibold text-fg">{order.trackingNumber}</span></p> : null}

          <h2 className="mt-10 mb-2 font-medium">Articles</h2>
          <ul className="divide-y divide-border">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">{i.image ? <Image src={i.image} alt="" fill sizes="64px" className="object-cover" /> : null}</span>
                <span className="flex-1 text-sm">
                  <span className="block font-medium">{i.name}</span>
                  <span className="text-muted">{i.variantName} · × {i.quantity}</span>
                </span>
                <span className="text-sm tabular-nums">{formatPrice(i.lineTotalMinor)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{formatPrice(order.subtotalMinor)}</dd></div>
            {order.discountMinor > 0 ? <div className="flex justify-between text-success"><dt>Remise {order.couponCode}</dt><dd className="tabular-nums">-{formatPrice(order.discountMinor)}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd className="tabular-nums">{order.shippingMinor ? formatPrice(order.shippingMinor) : "Offerte"}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.totalMinor)}</dd></div>
          </dl>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm">
            <h2 className="mb-3 font-medium">Livraison</h2>
            <p>{order.customerName}</p>
            <p className="text-muted">{order.addressLine}</p>
            <p className="text-muted">{order.city}, {order.governorate} {order.postalCode}</p>
            <p className="mt-2 text-muted">{order.customerPhone}</p>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm">
            <h2 className="mb-3 font-medium">Paiement</h2>
            <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            <p className="text-muted">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
            {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "UNPAID" && settings.payments.bankDetails ? (
              <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs whitespace-pre-line text-muted">{settings.payments.bankDetails}{"\n"}Référence : {order.number}</p>
            ) : null}
            {order.paymentMethod === "D17" && order.paymentStatus === "UNPAID" && settings.payments.d17Number ? (
              <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs text-muted">Envoyez {formatPrice(order.totalMinor)} via D17 au {settings.payments.d17Number} avec la référence {order.number}.</p>
            ) : null}
          </div>
          <ButtonLink href="/boutique" variant="secondary" className="w-full">Continuer mes achats</ButtonLink>
        </aside>
      </div>
    </Container>
  );
}
