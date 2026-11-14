import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminHeader, Table, td } from "@/components/admin/admin-ui";
import { Badge, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Clients" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const users = await db.user.findMany({
    where: { role: "CUSTOMER", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
  });
  const ids = users.map((u) => u.id);
  const stats = ids.length
    ? await db.$queryRaw<{ userId: string; orders: bigint; spent: bigint | null }[]>`
        SELECT "userId", COUNT(*) AS orders, SUM(CASE WHEN status NOT IN ('CANCELLED','RETURNED') THEN "totalMinor" ELSE 0 END) AS spent
        FROM orders WHERE "userId" IN (${Prisma.join(ids)}) GROUP BY "userId"`
    : [];
  const by = new Map(stats.map((s) => [s.userId, s]));
  return (
    <>
      <AdminHeader title="Clients" subtitle={`${users.length} compte(s) client · les commandes invité sont visibles dans Commandes`} />
      <form className="mb-5 flex gap-2" action="/admin/clients">
        <input name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone…" className="h-10 w-full max-w-sm rounded-full border border-border bg-surface px-4 text-sm focus:border-accent/60 focus:outline-none" />
        <button className={buttonClass("secondary", "sm", "h-10")}>Rechercher</button>
      </form>
      <Table head={["Client", "Téléphone", "Inscrit le", "Commandes", "Total dépensé", "Statut"]} empty={!users.length}>
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-surface-2">
            <td className={td}><Link href={`/admin/clients/${u.id}`} className="hover:text-accent"><span className="block font-medium">{u.name}</span><span className="text-xs text-subtle">{u.email}</span></Link></td>
            <td className={`${td} text-muted`}>{u.phone ?? "—"}</td>
            <td className={`${td} text-muted`}>{formatDate(u.createdAt)}</td>
            <td className={`${td} tabular-nums`}>{Number(by.get(u.id)?.orders ?? 0)}</td>
            <td className={`${td} tabular-nums`}>{formatPrice(Number(by.get(u.id)?.spent ?? 0))}</td>
            <td className={td}><Badge tone={u.status === "ACTIVE" ? "green" : "red"}>{u.status === "ACTIVE" ? "Actif" : "Suspendu"}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
