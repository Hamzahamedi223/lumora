import Image from "next/image";
import Link from "next/link";
import type { ProductCard as Card } from "@/server/catalog";
import { discountPercent } from "@/lib/format";
import { Price, Stars } from "@/components/ui";

export function ProductCard({ product: p, priority }: { product: Card; priority?: boolean }) {
  const off = discountPercent(p.priceMinor, p.compareAtMinor);
  const [first, second] = p.images;
  return (
    <Link href={`/produits/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-2">
        {first ? (
          <Image
            src={first.url}
            alt={first.alt || p.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""}`}
          />
        ) : null}
        {second ? (
          <Image src={second.url} alt={second.alt || p.name} fill sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw" className="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100" />
        ) : null}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {off ? <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-ink">-{off} %</span> : null}
          {p.isNew ? <span className="rounded-full bg-fg/90 px-2.5 py-1 text-[11px] font-bold text-bg">Nouveau</span> : null}
          {p.madeToOrder ? <span className="rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-semibold text-fg backdrop-blur">Sur commande</span> : null}
        </div>
        {!p.inStock ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-bg/80 px-2.5 py-1 text-[11px] font-semibold text-muted backdrop-blur">Épuisé</span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug font-light transition group-hover:text-accent">{p.name}</h3>
          {p.tagline ? <p className="truncate text-sm text-muted">{p.tagline}</p> : null}
        </div>
        {p.colors.length > 1 ? (
          <div className="mt-1.5 flex shrink-0 -space-x-1" aria-label={`${p.colors.length} couleurs`}>
            {p.colors.slice(0, 4).map((c) => (
              <span key={c.name} className="size-3.5 rounded-full ring-2 ring-bg" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <Price minor={p.priceMinor} compareAt={p.compareAtMinor} className="text-sm" />
        {p.rating ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Stars value={p.rating.avg} size={11} /> ({p.rating.count})
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Card[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
