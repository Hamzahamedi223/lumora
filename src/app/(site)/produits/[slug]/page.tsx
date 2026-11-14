import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatDate, formatPrice } from "@/lib/format";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ReviewForm } from "@/components/shop/review-form";
import { ProductGrid } from "@/components/shop/product-card";
import { Container, Price, SectionTitle, Stars } from "@/components/ui";
import { IconHand, IconLeaf, IconShield, IconTruck } from "@/components/icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    return (await getAllProductSlugs()).map((p) => ({ slug: p.slug }));
  } catch {
    return []; // DB unreachable at build time: pages render on first request instead
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produit introuvable" };
  return {
    title: p.name,
    description: `${p.tagline ?? p.name} — ${p.description.slice(0, 140)}`,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: { images: p.images[0] ? [p.images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [related, settings] = await Promise.all([getRelatedProducts(p.id, p.categoryId), getSettings()]);
  const off = discountPercent(p.priceMinor, p.compareAtMinor);
  const inStock = p.madeToOrder || p.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "Lumora" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TND",
      price: (p.priceMinor / 1000).toFixed(3),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.avg, reviewCount: p.rating.count } } : {}),
  };

  const specs = [
    ["Matière", p.material],
    ["Dimensions", p.dimensions],
    ["Ampoule", p.bulb],
    ["Poids", p.weight],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="py-8 sm:py-12">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-subtle" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-fg">Accueil</Link>/
          <Link href="/boutique" className="hover:text-fg">Boutique</Link>
          {p.category ? (
            <>
              /<Link href={`/boutique/${p.category.slug}`} className="hover:text-fg">{p.category.name}</Link>
            </>
          ) : null}
          /<span className="text-muted">{p.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <ProductGallery images={p.images} name={p.name} />
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              {p.isNew ? <span className="rounded-full bg-fg/90 px-2.5 py-1 text-[11px] font-bold text-bg">Nouveau</span> : null}
              {off ? <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-ink">-{off} %</span> : null}
              {p.category ? <span className="text-xs tracking-[0.2em] text-muted uppercase">{p.category.name}</span> : null}
            </div>
            <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl">{p.name}</h1>
            {p.tagline ? <p className="mt-2 text-lg text-muted">{p.tagline}</p> : null}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Price minor={p.priceMinor} compareAt={p.compareAtMinor} className="text-2xl" />
              {p.rating ? (
                <a href="#avis" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
                  <Stars value={p.rating.avg} /> {p.rating.avg} · {p.rating.count} avis
                </a>
              ) : null}
            </div>
            <div className="hairline my-8" />
            <AddToCart
              product={{ slug: p.slug, name: p.name, priceMinor: p.priceMinor, image: p.images[0]?.url ?? null, madeToOrder: p.madeToOrder, leadTimeDays: p.leadTimeDays }}
              variants={p.variants}
            />
            <ul className="mt-8 grid grid-cols-2 gap-3 text-xs text-muted">
              <li className="flex items-center gap-2.5 rounded-xl border border-border p-3"><IconTruck className="shrink-0 text-accent" width={18} />{settings.shipping.freeThresholdMinor > 0 ? `Offerte dès ${formatPrice(settings.shipping.freeThresholdMinor)}` : "Livraison partout en Tunisie"}</li>
              <li className="flex items-center gap-2.5 rounded-xl border border-border p-3"><IconShield className="shrink-0 text-accent" width={18} />Paiement à la livraison</li>
              <li className="flex items-center gap-2.5 rounded-xl border border-border p-3"><IconHand className="shrink-0 text-accent" width={18} />Fini à la main en Tunisie</li>
              <li className="flex items-center gap-2.5 rounded-xl border border-border p-3"><IconLeaf className="shrink-0 text-accent" width={18} />PLA biosourcé</li>
            </ul>
            <div className="mt-10 space-y-4 text-sm leading-relaxed text-pretty text-muted">
              {p.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
            {specs.length ? (
              <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </Container>

      <section id="avis" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow="Avis clients" title={p.rating ? <>{p.rating.avg}/5 · {p.rating.count} avis</> : "Soyez le premier à donner votre avis"} />
          </div>
          {p.reviews.length ? (
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {p.reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <time className="text-xs text-subtle">{formatDate(r.createdAt)}</time>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-pretty">{r.body}</p>
                  <p className="mt-4 text-sm font-medium text-muted">{r.name}</p>
                </article>
              ))}
            </div>
          ) : null}
          <div className="mt-10">
            <ReviewForm productId={p.id} />
          </div>
        </Container>
      </section>

      {related.length ? (
        <section className="border-t border-border py-16 sm:py-20">
          <Container>
            <SectionTitle eyebrow="À découvrir" title="Vous aimerez aussi" />
            <div className="mt-10">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
