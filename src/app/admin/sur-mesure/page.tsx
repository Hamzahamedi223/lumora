import type { Metadata } from "next";
import Link from "next/link";
import type { RequestStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, REQUEST_TYPE_LABEL } from "@/lib/constants";
import { AdminHeader, FilterTabs, Table, td } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Sur mesure" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const status = (Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[]).find((s) => s === statut);
  const [requests, counts] = await Promise.all([
    db.customRequest.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { files: true } } } }),
    db.customRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return (
    <>
      <AdminHeader title="Demandes sur mesure" subtitle={`${requests.length} demande(s)`} />
      <FilterTabs
        active={status ?? "all"}
        items={[
          { key: "all", label: "Toutes", href: "/admin/sur-mesure" },
          ...(Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[]).map((s) => ({ key: s, label: REQUEST_STATUS_LABEL[s], href: `/admin/sur-mesure?statut=${s}`, count: counts.find((c) => c.status === s)?._count._all ?? 0 })),
        ]}
      />
      <Table head={["Demande", "Client", "Type", "Budget", "Devis", "Date", "Statut"]} empty={!requests.length}>
        {requests.map((r) => (
          <tr key={r.id} className="hover:bg-surface-2">
            <td className={td}><Link href={`/admin/sur-mesure/${r.number}`} className="font-medium hover:text-accent">{r.number}</Link>{r._count.files ? <span className="ml-2 text-xs text-subtle">📎 {r._count.files}</span> : null}</td>
            <td className={td}><span className="block">{r.name}</span><span className="text-xs text-subtle">{r.phone}</span></td>
            <td className={td}>{REQUEST_TYPE_LABEL[r.type]}</td>
            <td className={`${td} text-muted`}>{r.budget ?? "—"}</td>
            <td className={`${td} tabular-nums`}>{r.quoteMinor != null ? formatPrice(r.quoteMinor) : "—"}</td>
            <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(r.createdAt)}</td>
            <td className={td}><Badge tone={REQUEST_STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
