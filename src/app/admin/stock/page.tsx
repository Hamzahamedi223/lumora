import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { LOW_STOCK } from "@/lib/constants";
import { AdminHeader, FilterTabs, Panel, Table, td } from "@/components/admin/admin-ui";
import { StockCell } from "./stock-cell";

export const metadata: Metadata = { title: "Stock" };

const REASON: Record<string, string> = { ADJUSTMENT: "Ajustement", ORDER: "Commande", CANCEL_RESTOCK: "Annulation", RETURN_RESTOCK: "Retour" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const { filtre } = await searchParams;
  const low = filtre === "faible";
  const [variants, movements] = await Promise.all([
    db.variant.findMany({
      where: { isActive: true, product: { madeToOrder: false, status: { not: "ARCHIVED" } }, ...(low ? { stock: { lte: LOW_STOCK } } : {}) },
      orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
      include: { product: { select: { id: true, name: true, status: true } } },
    }),
    db.stockMovement.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { variant: { select: { name: true, product: { select: { name: true } } } } } }),
  ]);
  return (
    <>
      <AdminHeader title="Stock" subtitle="Modifiez une quantité puis validez : chaque changement est tracé." />
      <FilterTabs active={low ? "low" : "all"} items={[{ key: "all", label: "Tout", href: "/admin/stock" }, { key: "low", label: `Stock faible (≤ ${LOW_STOCK})`, href: "/admin/stock?filtre=faible" }]} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Table head={["Produit", "Variante", "SKU", "Stock"]} empty={!variants.length}>
          {variants.map((v) => (
            <tr key={v.id} className="hover:bg-surface-2">
              <td className={td}><Link href={`/admin/produits/${v.product.id}`} className="hover:text-accent">{v.product.name}</Link>{v.product.status === "DRAFT" ? <span className="ml-2 text-xs text-subtle">(brouillon)</span> : null}</td>
              <td className={td}><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: v.colorHex ?? "#888" }} />{v.name}</span></td>
              <td className={`${td} text-xs text-subtle`}>{v.sku ?? "—"}</td>
              <td className={td}><StockCell variantId={v.id} stock={v.stock} /></td>
            </tr>
          ))}
        </Table>
        <Panel title="Derniers mouvements">
          <ul className="space-y-3 text-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate">{m.variant.product.name} · <span className="text-muted">{m.variant.name}</span></span>
                  <span className="text-xs text-subtle">{REASON[m.reason]}{m.note ? ` · ${m.note}` : ""} · {formatDate(m.createdAt, true)}</span>
                </span>
                <span className={`shrink-0 font-semibold tabular-nums ${m.delta > 0 ? "text-success" : "text-danger"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
