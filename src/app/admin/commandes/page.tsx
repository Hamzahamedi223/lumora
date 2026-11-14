import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { AdminHeader, FilterTabs, Table, td } from "@/components/admin/admin-ui";
import { Badge, buttonClass, Pagination } from "@/components/ui";

export const metadata: Metadata = { title: "Commandes" };
const PER = 25;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).find((s) => s === sp.statut);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { customerEmail: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q } }] }
      : {}),
  };
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { _count: { select: { items: true } } } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const all = { statut: status, q: q || undefined, ...p };
    for (const [k, v] of Object.entries(all)) if (v) u.set(k, v);
    return `/admin/commandes${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="Commandes"
        subtitle={`${total} commande${total > 1 ? "s" : ""}`}
        actions={<a href={`/api/admin/export/orders${status ? `?statut=${status}` : ""}`} className={buttonClass("secondary", "sm")}>Exporter CSV</a>}
      />
      <FilterTabs
        active={status ?? "all"}
        items={[
          { key: "all", label: "Toutes", href: href({ statut: undefined, page: undefined }), count: counts.reduce((s, c) => s + c._count._all, 0) },
          ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s], href: href({ statut: s, page: undefined }), count: countOf(s) })),
        ]}
      />
      <form className="mb-5 flex gap-2" action="/admin/commandes">
        {status ? <input type="hidden" name="statut" value={status} /> : null}
        <input name="q" defaultValue={q} placeholder="N°, nom, e-mail, téléphone…" className="h-10 w-full max-w-sm rounded-full border border-border bg-surface px-4 text-sm focus:border-accent/60 focus:outline-none" />
        <button className={buttonClass("secondary", "sm", "h-10")}>Rechercher</button>
      </form>
      <Table head={["Commande", "Client", "Date", "Articles", "Total", "Paiement", "Statut"]} empty={!orders.length}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-surface-2">
            <td className={td}><Link href={`/admin/commandes/${o.number}`} className="font-medium hover:text-accent">{o.number}</Link></td>
            <td className={td}><span className="block">{o.customerName}</span><span className="text-xs text-subtle">{o.governorate} · {o.customerPhone}</span></td>
            <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(o.createdAt, true)}</td>
            <td className={`${td} tabular-nums`}>{o._count.items}</td>
            <td className={`${td} font-semibold tabular-nums whitespace-nowrap`}>{formatPrice(o.totalMinor)}</td>
            <td className={td}><Badge tone={o.paymentStatus === "PAID" ? "green" : o.paymentStatus === "REFUNDED" ? "zinc" : "amber"}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</Badge></td>
            <td className={td}><Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => href({ page: p > 1 ? String(p) : undefined })} />
    </>
  );
}
