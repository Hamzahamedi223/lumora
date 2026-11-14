import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/constants";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default async function AccountOrders() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, number: true, createdAt: true, status: true, totalMinor: true, _count: { select: { items: true } } },
  });
  if (!orders.length) return <EmptyState title="Aucune commande pour l'instant" text="Vos commandes apparaîtront ici." action={<ButtonLink href="/boutique">Découvrir la collection</ButtonLink>} />;
  return (
    <div>
      <h2 className="mb-5 text-lg font-medium">Mes commandes</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/compte/commandes/${o.number}`} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2">
              <span>
                <span className="block font-medium">{o.number}</span>
                <span className="text-sm text-muted">{formatDate(o.createdAt)} · {o._count.items} article{o._count.items > 1 ? "s" : ""}</span>
              </span>
              <span className="flex items-center gap-4">
                <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                <span className="w-28 text-right font-semibold tabular-nums">{formatPrice(o.totalMinor)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
