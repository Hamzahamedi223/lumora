import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ORDER_TRANSITIONS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { AdminHeader, Panel } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui";
import { OrderNoteForm, OrderPaymentForm, OrderStatusForm, PrintButton } from "./order-forms";

export default async function AdminOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const [o, settings] = await Promise.all([
    db.order.findUnique({ where: { number }, include: { items: true, events: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, name: true } } } }),
    getSettings(),
  ]);
  if (!o) notFound();
  const previous = await db.order.count({ where: { customerEmail: o.customerEmail, id: { not: o.id } } });
  return (
    <>
      <div className="no-print">
        <AdminHeader
          back={{ href: "/admin/commandes", label: "Commandes" }}
          title={<span className="flex flex-wrap items-center gap-3">{o.number} <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge></span>}
          subtitle={`Passée le ${formatDate(o.createdAt, true)}`}
          actions={<PrintButton />}
        />
      </div>

      {/* Printable delivery note */}
      <div className="mb-6 hidden print:block">
        <p className="text-2xl font-semibold">{settings.store.name} — Bon de livraison</p>
        <p>{settings.store.address} · {settings.store.phone}</p>
        <p className="mt-4">Commande {o.number} du {formatDate(o.createdAt)}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Articles" className="print-light">
            <ul className="divide-y divide-border">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <span className="no-print relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">{i.image ? <Image src={i.image} alt="" fill sizes="56px" className="object-cover" /> : null}</span>
                  <span className="flex-1 text-sm">
                    {i.productId ? <Link href={`/admin/produits/${i.productId}`} className="font-medium hover:text-accent">{i.name}</Link> : <span className="font-medium">{i.name}</span>}
                    <span className="block text-muted">{i.variantName}{i.madeToOrder ? " · sur commande" : ""}</span>
                  </span>
                  <span className="text-sm tabular-nums text-muted">{i.quantity} × {formatPrice(i.unitPriceMinor)}</span>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatPrice(i.lineTotalMinor)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{formatPrice(o.subtotalMinor)}</dd></div>
              {o.discountMinor ? <div className="flex justify-between text-success"><dt>Remise {o.couponCode}</dt><dd className="tabular-nums">-{formatPrice(o.discountMinor)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd className="tabular-nums">{o.shippingMinor ? formatPrice(o.shippingMinor) : "Offerte"}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(o.totalMinor)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Client & livraison" className="print-light">
              <div className="space-y-1 text-sm">
                <p className="font-medium">{o.customerName}</p>
                <p><a href={`tel:${o.customerPhone}`} className="text-accent">{o.customerPhone}</a></p>
                <p><a href={`mailto:${o.customerEmail}`} className="text-muted hover:text-fg">{o.customerEmail}</a></p>
                <p className="pt-2">{o.addressLine}</p>
                <p>{o.city}, {o.governorate} {o.postalCode}</p>
                {o.notes ? <p className="mt-3 rounded-lg bg-surface-2 p-3 text-muted">« {o.notes} »</p> : null}
                <p className="no-print pt-3 text-xs text-subtle">
                  {o.user ? <>Compte client : <Link href={`/admin/clients/${o.user.id}`} className="text-accent">{o.user.name}</Link> · </> : "Commande invité · "}
                  {previous} autre(s) commande(s)
                </p>
              </div>
            </Panel>
            <Panel title="Paiement" className="print-light">
              <p className="text-sm">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</p>
              <p className="mb-4 text-sm text-muted">{PAYMENT_STATUS_LABEL[o.paymentStatus]}</p>
              <div className="no-print"><OrderPaymentForm orderId={o.id} current={o.paymentStatus} /></div>
            </Panel>
          </div>

          <Panel title="Historique" className="no-print">
            <ol className="space-y-4">
              {o.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  <span>
                    <span className="block">{e.note}</span>
                    <span className="text-xs text-subtle">{formatDate(e.createdAt, true)}{e.actor ? ` · ${e.actor}` : ""}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="no-print space-y-6">
          <Panel title="Changer le statut">
            {ORDER_TRANSITIONS[o.status].length ? (
              <OrderStatusForm orderId={o.id} transitions={ORDER_TRANSITIONS[o.status].map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} trackingNumber={o.trackingNumber ?? ""} />
            ) : (
              <p className="text-sm text-muted">Statut final : aucune action possible.</p>
            )}
          </Panel>
          <Panel title="Note interne">
            <OrderNoteForm orderId={o.id} note={o.adminNote ?? ""} />
          </Panel>
        </div>
      </div>
    </>
  );
}
