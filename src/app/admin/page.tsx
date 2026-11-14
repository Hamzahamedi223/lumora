import Link from "next/link";
import { db } from "@/lib/db";
import { dashboardStats } from "@/server/services/analytics";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/constants";
import { AdminHeader, Delta, FilterTabs, Panel } from "@/components/admin/admin-ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { Badge } from "@/components/ui";

const RANGES = [7, 30, 90] as const;

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ j?: string }> }) {
  const { j } = await searchParams;
  const days = RANGES.find((r) => String(r) === j) ?? 30;
  const [s, recent] = await Promise.all([
    dashboardStats(days),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, number: true, customerName: true, totalMinor: true, status: true, createdAt: true } }),
  ]);
  const maxTop = Math.max(1, ...s.top.map((t) => t.revenue));
  const todo = [
    { n: s.todo.pendingOrders, label: "commande(s) à confirmer", href: "/admin/commandes?statut=PENDING" },
    { n: s.todo.newRequests, label: "demande(s) sur mesure", href: "/admin/sur-mesure?statut=NEW" },
    { n: s.todo.pendingReviews, label: "avis à modérer", href: "/admin/avis" },
    { n: s.todo.unreadMessages, label: "message(s) non lu(s)", href: "/admin/messages" },
  ].filter((t) => t.n > 0);

  return (
    <>
      <AdminHeader title="Vue d'ensemble" subtitle={`${days} derniers jours, comparés aux ${days} jours précédents`} />
      <FilterTabs active={String(days)} items={RANGES.map((r) => ({ key: String(r), label: `${r} jours`, href: `/admin?j=${r}` }))} />

      {todo.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {todo.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm hover:bg-accent/20">
              <b className="tabular-nums">{t.n}</b> {t.label} →
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Chiffre d'affaires", value: formatPrice(s.revenue), delta: s.revenueDelta },
          { label: "Commandes", value: String(s.orders), delta: s.ordersDelta },
          { label: "Panier moyen", value: formatPrice(s.aov), delta: s.aovDelta },
          { label: "Nouveaux clients", value: String(s.newCustomers), delta: null },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{k.label}</p>
            <p className="mt-3 font-display text-3xl font-light tabular-nums">{k.value}</p>
            <div className="mt-2"><Delta value={k.delta} /></div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Chiffre d'affaires par jour">
          <RevenueChart data={s.series} />
        </Panel>
        <Panel title="Commandes par statut">
          <ul className="space-y-3">
            {(Object.keys(ORDER_STATUS_LABEL) as (keyof typeof ORDER_STATUS_LABEL)[]).map((st) => (
              <li key={st} className="flex items-center justify-between text-sm">
                <Link href={`/admin/commandes?statut=${st}`} className="hover:text-accent"><Badge tone={ORDER_STATUS_TONE[st]}>{ORDER_STATUS_LABEL[st]}</Badge></Link>
                <span className="tabular-nums">{s.byStatus[st] ?? 0}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Meilleures ventes">
          {s.top.length ? (
            <ul className="space-y-4">
              {s.top.map((t) => (
                <li key={t.name}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span className="truncate">{t.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{t.qty} · {formatPrice(t.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(t.revenue / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Pas encore de ventes sur la période.</p>}
        </Panel>
        <Panel title="Stock faible" actions={<Link href="/admin/stock" className="text-xs text-muted hover:text-accent">Gérer →</Link>}>
          {s.lowStock.length ? (
            <ul className="divide-y divide-border text-sm">
              {s.lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 py-2">
                  <Link href={`/admin/produits/${v.product.id}`} className="truncate hover:text-accent">{v.product.name} · <span className="text-muted">{v.name}</span></Link>
                  <span className={v.stock === 0 ? "font-semibold text-danger" : "text-warning"}>{v.stock}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Tous les stocks sont confortables.</p>}
        </Panel>
        <Panel title="Dernières commandes" actions={<Link href="/admin/commandes" className="text-xs text-muted hover:text-accent">Tout voir →</Link>}>
          <ul className="divide-y divide-border text-sm">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes/${o.number}`} className="flex items-center justify-between gap-3 py-2 hover:text-accent">
                  <span className="min-w-0">
                    <span className="block truncate">{o.customerName}</span>
                    <span className="text-xs text-subtle">{formatDate(o.createdAt, true)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block tabular-nums">{formatPrice(o.totalMinor)}</span>
                    <Badge tone={ORDER_STATUS_TONE[o.status]} className="mt-0.5">{ORDER_STATUS_LABEL[o.status]}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
