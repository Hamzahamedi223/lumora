import Link from "next/link";
import { getCategories, getShopProducts, type ShopQuery } from "@/server/catalog";
import { parsePrice } from "@/lib/format";
import { ProductGrid } from "./product-card";
import { SortSelect } from "./sort-select";
import { ButtonLink, cn, Container, EmptyState, Pagination } from "@/components/ui";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SORTS = ["new", "price-asc", "price-desc", "popular"] as const;

export function parseShopQuery(sp: SearchParams, category?: string): ShopQuery {
  const sort = one(sp.tri);
  const min = parsePrice(one(sp.min));
  const max = parsePrice(one(sp.max));
  return {
    category,
    q: one(sp.q).trim().slice(0, 80) || undefined,
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as ShopQuery["sort"]) : "new",
    min: min ?? undefined,
    max: max ?? undefined,
    inStock: one(sp.stock) === "1" || undefined,
    sale: one(sp.promo) === "1" || undefined,
    page: Math.max(1, Math.min(500, parseInt(one(sp.page), 10) || 1)),
  };
}

export async function ShopView({ sp, category }: { sp: SearchParams; category?: string }) {
  const query = parseShopQuery(sp, category);
  const [categories, result] = await Promise.all([getCategories(), getShopProducts(query)]);
  const base = category ? `/boutique/${category}` : "/boutique";

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | undefined> = {
      q: query.q,
      tri: query.sort === "new" ? undefined : query.sort,
      min: one(sp.min) || undefined,
      max: one(sp.max) || undefined,
      stock: query.inStock ? "1" : undefined,
      promo: query.sale ? "1" : undefined,
      page: undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const chip = (active: boolean) =>
    cn("rounded-full border px-4 py-2 text-sm transition whitespace-nowrap", active ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg");

  return (
    <Container className="py-10 sm:py-14">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({}).replace(base, "/boutique")} className={chip(!category)}>Tout</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/boutique/${c.slug}`} className={chip(category === c.slug)}>
            {c.name} <span className="text-subtle">{c.productCount}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-y border-border py-4 lg:flex-row lg:items-center lg:justify-between">
        <form action={base} method="get" className="flex flex-wrap items-center gap-2">
          {query.sort !== "new" ? <input type="hidden" name="tri" value={query.sort} /> : null}
          <input name="q" defaultValue={query.q} placeholder="Rechercher…" aria-label="Rechercher" className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm placeholder:text-subtle focus:border-accent/60 focus:outline-none sm:w-48" />
          <input name="min" defaultValue={one(sp.min)} inputMode="decimal" placeholder="Prix min" aria-label="Prix minimum (DT)" className="h-10 w-24 rounded-full border border-border bg-surface px-4 text-sm placeholder:text-subtle focus:border-accent/60 focus:outline-none" />
          <input name="max" defaultValue={one(sp.max)} inputMode="decimal" placeholder="Prix max" aria-label="Prix maximum (DT)" className="h-10 w-24 rounded-full border border-border bg-surface px-4 text-sm placeholder:text-subtle focus:border-accent/60 focus:outline-none" />
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm text-muted has-checked:border-accent has-checked:text-fg">
            <input type="checkbox" name="stock" value="1" defaultChecked={!!query.inStock} className="accent-[#e8b062]" /> En stock
          </label>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm text-muted has-checked:border-accent has-checked:text-fg">
            <input type="checkbox" name="promo" value="1" defaultChecked={!!query.sale} className="accent-[#e8b062]" /> Offres
          </label>
          <button type="submit" className="h-10 rounded-full bg-surface-3 px-5 text-sm font-semibold hover:bg-border-strong">Filtrer</button>
          {query.q || query.min || query.max || query.inStock || query.sale ? (
            <Link href={base} className="px-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">Réinitialiser</Link>
          ) : null}
        </form>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted tabular-nums">{result.total} pièce{result.total > 1 ? "s" : ""}</p>
          <SortSelect value={query.sort ?? "new"} options={SORTS.map((s) => ({ value: s, href: href({ tri: s === "new" ? undefined : s }) }))} />
        </div>
      </div>

      <div className="mt-10">
        {result.items.length ? (
          <ProductGrid products={result.items} priorityCount={4} />
        ) : (
          <EmptyState title="Aucune pièce trouvée" text="Essayez d'autres filtres ou parcourez toute la collection." action={<ButtonLink href="/boutique" variant="secondary">Voir toute la collection</ButtonLink>} />
        )}
      </div>
      <Pagination page={result.page} pages={result.pages} href={(n) => href({ page: n > 1 ? String(n) : undefined })} />
    </Container>
  );
}
