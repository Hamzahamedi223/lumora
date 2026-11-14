import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/constants";
import { toggleUserStatusAction } from "@/server/actions/admin";
import { AdminHeader, Panel, Table, td } from "@/components/admin/admin-ui";
import { Badge, Button } from "@/components/ui";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await db.user.findUnique({ where: { id }, include: { orders: { orderBy: { createdAt: "desc" } } } });
  if (!u || u.role !== "CUSTOMER") notFound();
  const spent = u.orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED").reduce((s, o) => s + o.totalMinor, 0);
  return (
    <>
      <AdminHeader back={{ href: "/admin/clients", label: "Clients" }} title={u.name} subtitle={`Client depuis le ${formatDate(u.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Panel title="Profil">
          <div className="space-y-2 text-sm">
            <p><a href={`mailto:${u.email}`} className="hover:text-accent">{u.email}</a></p>
            <p className="text-muted">{u.phone ?? "Pas de téléphone"}</p>
            <p className="text-muted">Dernière connexion : {u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "—"}</p>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-subtle">Commandes</p><p className="text-lg tabular-nums">{u.orders.length}</p></div>
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-subtle">Dépensé</p><p className="text-lg tabular-nums">{formatPrice(spent)}</p></div>
            </div>
            <form action={toggleUserStatusAction} className="pt-3">
              <input type="hidden" name="id" value={u.id} />
              <Button type="submit" variant={u.status === "ACTIVE" ? "danger" : "secondary"} size="sm">{u.status === "ACTIVE" ? "Suspendre le compte" : "Réactiver le compte"}</Button>
            </form>
          </div>
        </Panel>
        <Table head={["Commande", "Date", "Total", "Statut"]} empty={!u.orders.length}>
          {u.orders.map((o) => (
            <tr key={o.id} className="hover:bg-surface-2">
              <td className={td}><Link href={`/admin/commandes/${o.number}`} className="hover:text-accent">{o.number}</Link></td>
              <td className={`${td} text-muted`}>{formatDate(o.createdAt)}</td>
              <td className={`${td} tabular-nums`}>{formatPrice(o.totalMinor)}</td>
              <td className={td}><Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge></td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
