import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { deleteReviewAction, moderateReviewAction } from "@/server/actions/admin";
import { AdminHeader, FilterTabs } from "@/components/admin/admin-ui";
import { Badge, Button, EmptyState, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Avis" };
const LABEL: Record<ReviewStatus, string> = { PENDING: "À modérer", APPROVED: "Publiés", REJECTED: "Refusés" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"] as const).find((s) => s === statut) ?? "PENDING";
  const [reviews, counts] = await Promise.all([
    db.review.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 100, include: { product: { select: { name: true, slug: true } } } }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return (
    <>
      <AdminHeader title="Avis clients" subtitle="Les avis ne sont publiés qu'après votre validation." />
      <FilterTabs active={status} items={(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => ({ key: s, label: LABEL[s], href: `/admin/avis?statut=${s}`, count: counts.find((c) => c.status === s)?._count._all ?? 0 }))} />
      {reviews.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="text-xs text-subtle">{formatDate(r.createdAt, true)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{r.body}</p>
              <p className="mt-3 text-sm text-muted">{r.name} · <Link href={`/produits/${r.product.slug}`} target="_blank" className="text-accent hover:underline">{r.product.name}</Link></p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {r.status !== "APPROVED" ? <form action={moderateReviewAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="APPROVED" /><Button size="sm">Publier</Button></form> : <Badge tone="green">Publié</Badge>}
                {r.status !== "REJECTED" ? <form action={moderateReviewAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="REJECTED" /><Button size="sm" variant="secondary">{r.status === "APPROVED" ? "Dépublier" : "Refuser"}</Button></form> : null}
                <form action={deleteReviewAction} className="ml-auto"><input type="hidden" name="id" value={r.id} /><Button size="sm" variant="ghost">Supprimer</Button></form>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Rien à afficher" text={status === "PENDING" ? "Aucun avis en attente de modération." : undefined} />}
    </>
  );
}
