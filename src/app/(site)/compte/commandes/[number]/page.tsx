import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { CancelOrderButton } from "./cancel-button";

export default async function AccountOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser();
  const o = await db.order.findFirst({ where: { number, userId: user.id }, include: { items: true, events: { orderBy: { createdAt: "asc" } } } });
  if (!o) notFound();
  return (
    <div className="space-y-6">
      <Link href="/compte" className="text-sm text-muted hover:text-fg">← Mes commandes</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium">{o.number}</h2>
          <p className="text-sm text-muted">{formatDate(o.createdAt, true)}</p>
        </div>
        <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <OrderTimeline status={o.status} events={o.events.map((e) => ({ status: e.status, createdAt: e.createdAt.toISOString() }))} />
        {o.trackingNumber ? <p className="mt-5 text-sm text-muted">N° de suivi : <b className="text-fg">{o.trackingNumber}</b></p> : null}
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ul className="divide-y divide-border">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">{i.image ? <Image src={i.image} alt="" fill sizes="56px" className="object-cover" /> : null}</span>
              <span className="flex-1 text-sm"><span className="block">{i.name}</span><span className="text-muted">{i.variantName} · × {i.quantity}</span></span>
              <span className="text-sm tabular-nums">{formatPrice(i.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd>{formatPrice(o.subtotalMinor)}</dd></div>
          {o.discountMinor ? <div className="flex justify-between text-success"><dt>Remise</dt><dd>-{formatPrice(o.discountMinor)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd>{o.shippingMinor ? formatPrice(o.shippingMinor) : "Offerte"}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatPrice(o.totalMinor)}</dd></div>
        </dl>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
          <p className="mb-2 font-medium">Livraison</p>
          <p className="text-muted">{o.customerName}<br />{o.addressLine}<br />{o.city}, {o.governorate}<br />{o.customerPhone}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
          <p className="mb-2 font-medium">Paiement</p>
          <p className="text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod]}<br />{PAYMENT_STATUS_LABEL[o.paymentStatus]}</p>
        </div>
      </div>
      {o.status === "PENDING" ? <CancelOrderButton number={o.number} /> : null}
    </div>
  );
}
