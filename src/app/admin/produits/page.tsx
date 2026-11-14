import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma, ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { AdminHeader, FilterTabs, Table, td } from "@/components/admin/admin-ui";
import { Badge, ButtonLink, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Produits" };
const STATUS_LABEL: Record<ProductStatus, string> = { ACTIVE: "En ligne", DRAFT: "Brouillon", ARCHIVED: "Archivé" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; archived?: string }> }) {
  const sp = await searchParams;
  const status = (["ACTIVE", "DRAFT", "ARCHIVED"] as const).find((s) => s === sp.statut);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const where: Prisma.ProductWhereInput = { ...(status ? { status } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) };
  const [products, counts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true }, select: { stock: true } } },
    }),
    db.product.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const c = (s: ProductStatus) => counts.find((x) => x.status === s)?._count._all ?? 0;
  return (
    <>
      <AdminHeader title="Produits" subtitle={`${products.length} produit(s)`} actions={<ButtonLink href="/admin/produits/nouveau" size="sm">+ Nouveau produit</ButtonLink>} />
      {sp.archived ? <p className="mb-5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">Ce produit a déjà été commandé : il a été archivé (masqué de la boutique) plutôt que supprimé, pour conserver l&apos;historique.</p> : null}
      <FilterTabs
        active={status ?? "all"}
        items={[
          { key: "all", label: "Tous", href: "/admin/produits", count: counts.reduce((s, x) => s + x._count._all, 0) },
          ...(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => ({ key: s, label: STATUS_LABEL[s], href: `/admin/produits?statut=${s}`, count: c(s) })),
        ]}
      />
      <form className="mb-5 flex gap-2" action="/admin/produits">
        {status ? <input type="hidden" name="statut" value={status} /> : null}
        <input name="q" defaultValue={q} placeholder="Rechercher un produit…" className="h-10 w-full max-w-sm rounded-full border border-border bg-surface px-4 text-sm focus:border-accent/60 focus:outline-none" />
        <button className={buttonClass("secondary", "sm", "h-10")}>Rechercher</button>
      </form>
      <Table head={["Produit", "Catégorie", "Prix", "Stock", "Ventes", "Statut"]} empty={!products.length}>
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <tr key={p.id} className="hover:bg-surface-2">
              <td className={td}>
                <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 hover:text-accent">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">{p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" /> : null}</span>
                  <span>
                    <span className="block font-medium">{p.name}</span>
                    <span className="text-xs text-subtle">{p.variants.length} variante(s){p.featured ? " · ★ mis en avant" : ""}</span>
                  </span>
                </Link>
              </td>
              <td className={`${td} text-muted`}>{p.category?.name ?? "—"}</td>
              <td className={`${td} tabular-nums whitespace-nowrap`}>{formatPrice(p.priceMinor)}{p.compareAtMinor ? <span className="ml-1 text-xs text-subtle line-through">{formatPrice(p.compareAtMinor)}</span> : null}</td>
              <td className={`${td} tabular-nums`}>{p.madeToOrder ? <span className="text-muted">Sur commande</span> : <span className={stock === 0 ? "text-danger" : stock <= 3 ? "text-warning" : ""}>{stock}</span>}</td>
              <td className={`${td} tabular-nums text-muted`}>{p.salesCount}</td>
              <td className={td}><Badge tone={p.status === "ACTIVE" ? "green" : p.status === "DRAFT" ? "amber" : "zinc"}>{STATUS_LABEL[p.status]}</Badge></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
