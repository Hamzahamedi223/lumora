import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getBestSellers, getCategories, getFeaturedProducts, getHomeReviews } from "@/server/catalog";
import { ProductGrid } from "@/components/shop/product-card";
import { ButtonLink, Container, Eyebrow, SectionTitle, Stars } from "@/components/ui";
import { IconArrow, IconHand, IconLeaf, IconShield, IconTruck } from "@/components/icons";

export default async function HomePage() {
  const [settings, categories, featured, best, reviews] = await Promise.all([
    getSettings(),
    getCategories(),
    getFeaturedProducts(8),
    getBestSellers(4),
    getHomeReviews(),
  ]);
  const s = settings.store;
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="lamp-glow flicker pointer-events-none absolute top-1/2 right-[-10%] size-[900px] -translate-y-1/2 opacity-80 lg:right-[5%]" />
        <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="max-w-xl">
            <Eyebrow className="reveal mb-6">Atelier tunisien · Impression 3D</Eyebrow>
            <h1 className="reveal reveal-1 font-display text-5xl leading-[1.02] font-light tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {s.heroTitle.split(",")[0]}
              {s.heroTitle.includes(",") ? (
                <>
                  ,<br />
                  <span className="text-glow italic">{s.heroTitle.split(",").slice(1).join(",").trim()}</span>
                </>
              ) : null}
            </h1>
            <p className="reveal reveal-2 mt-7 max-w-lg text-lg leading-relaxed text-pretty text-muted">{s.heroSubtitle}</p>
            <div className="reveal reveal-3 mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/boutique" size="lg">
                Explorer la collection <IconArrow width={18} height={18} />
              </ButtonLink>
              <ButtonLink href="/sur-mesure" variant="secondary" size="lg">
                Créer sur mesure
              </ButtonLink>
            </div>
            <dl className="reveal reveal-4 mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                ["100 %", "fabriqué en Tunisie"],
                ["Biosourcé", "PLA d'origine végétale"],
                ["48 h", "expédition en stock"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-light text-fg">{k}</dt>
                  <dd className="mt-1 text-xs text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="reveal reveal-2 relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-border">
              <Image src="/catalog/hero.webp" alt="Lampe Torsade allumée" fill priority sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
            </div>
            <Link href="/produits/torsade" className="absolute -bottom-5 left-4 flex items-center gap-4 rounded-2xl border border-border bg-surface/90 p-3 pr-5 shadow-2xl backdrop-blur-xl sm:-left-8">
              <span className="relative size-14 overflow-hidden rounded-xl">
                <Image src="/catalog/torsade-day.webp" alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Nouveauté</span>
                <span className="font-display text-lg font-light">Torsade</span>
              </span>
            </Link>
          </div>
        </Container>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-border bg-surface/50 py-5">
        <div className="marquee flex w-max gap-12 font-display text-2xl font-light whitespace-nowrap text-subtle">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Lampes à poser", "✦", "Suspensions", "✦", "Art mural", "✦", "Pièces sur mesure", "✦", "Matériaux biosourcés", "✦", "Fait main à Tunis", "✦"].map((t, i) => (
              <span key={`${k}-${i}`} className={t === "✦" ? "text-accent" : ""}>{t}</span>
            )),
          )}
        </div>
      </div>

      {/* Collections */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow="Collections" title="Trois manières d'habiter la lumière" />
            <Link href="/boutique" className="flex items-center gap-2 text-sm text-muted hover:text-accent">
              Tout voir <IconArrow width={16} height={16} />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {categories.map((c, i) => (
              <Link key={c.id} href={`/boutique/${c.slug}`} className={`group relative overflow-hidden rounded-3xl border border-border ${i === 0 && categories.length > 1 ? "md:row-span-2" : ""}`}>
                <div className={`relative h-full ${i === 0 ? "aspect-[4/5] md:aspect-auto md:min-h-[560px]" : "aspect-[16/10]"}`}>
                  {c.image ? <Image src={c.image} alt={c.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                    <div>
                      <p className="font-display text-3xl font-light">{c.name}</p>
                      <p className="mt-1 text-sm text-muted">{c.productCount} pièce{c.productCount > 1 ? "s" : ""}</p>
                    </div>
                    <span className="grid size-11 place-items-center rounded-full border border-border-strong bg-bg/50 backdrop-blur transition group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
                      <IconArrow width={18} height={18} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured */}
      {featured.length ? (
        <section className="pb-20 sm:pb-28">
          <Container>
            <SectionTitle eyebrow="Sélection" title="Pièces signature" intro="Nos créations les plus emblématiques, imprimées couche par couche puis finies à la main." />
            <div className="mt-12">
              <ProductGrid products={featured} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Story */}
      <section className="relative overflow-hidden border-y border-border bg-surface/40 py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
              <Image src="/catalog/medina-lit.webp" alt="Lanterne Médina" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-3xl">
              <Image src="/catalog/atlas-day.webp" alt="Relief Atlas" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
          </div>
          <div>
            <SectionTitle
              eyebrow="L'atelier"
              title={<>Des objets pensés pour durer, <span className="italic text-accent">fabriqués ici.</span></>}
              intro="Chaque pièce Lumora naît dans notre atelier en Tunisie : dessinée en 3D, imprimée pendant de longues heures dans un PLA d'origine végétale, puis poncée, contrôlée et emballée à la main."
            />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                [IconLeaf, "Matières biosourcées", "PLA issu de l'amidon de maïs, sans solvant."],
                [IconHand, "Finitions à la main", "Chaque pièce est contrôlée avant expédition."],
                [IconTruck, "Livraison nationale", `Partout en Tunisie en ${settings.shipping.deliveryDays}.`],
                [IconShield, "Paiement à la livraison", "Payez en toute sérénité à réception."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof IconLeaf;
                return (
                  <li key={t as string} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border-strong text-accent"><I /></span>
                    <span>
                      <span className="block font-medium">{t as string}</span>
                      <span className="mt-1 block text-sm text-muted">{d as string}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <ButtonLink href="/a-propos" variant="secondary" className="mt-10">Découvrir l&apos;atelier</ButtonLink>
          </div>
        </Container>
      </section>

      {/* Best sellers */}
      {best.length ? (
        <section className="py-20 sm:py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow="Les plus aimées" title="Meilleures ventes" />
              <Link href="/boutique?tri=popular" className="flex items-center gap-2 text-sm text-muted hover:text-accent">
                Voir tout <IconArrow width={16} height={16} />
              </Link>
            </div>
            <div className="mt-12">
              <ProductGrid products={best} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Reviews */}
      {reviews.length ? (
        <section className="pb-20 sm:pb-28">
          <Container>
            <SectionTitle eyebrow="Ils nous font confiance" title="Ce que disent nos clients" align="center" />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="flex flex-col rounded-3xl border border-border bg-surface p-7">
                  <Stars value={r.rating} />
                  <blockquote className="mt-5 flex-1 font-display text-lg leading-relaxed font-light text-pretty">« {r.body} »</blockquote>
                  <figcaption className="mt-6 flex items-center justify-between text-sm">
                    <span className="font-medium">{r.name}</span>
                    <Link href={`/produits/${r.product.slug}`} className="text-muted hover:text-accent">{r.product.name}</Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Custom CTA */}
      <section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface px-6 py-16 text-center sm:px-16 sm:py-24">
            <div className="lamp-glow pointer-events-none absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2" />
            <div className="relative">
              <Eyebrow className="mb-5">Sur mesure</Eyebrow>
              <h2 className="mx-auto max-w-3xl font-display text-4xl font-light tracking-tight text-balance sm:text-5xl">Une idée, un lieu, une lumière qui vous ressemble.</h2>
              <p className="mx-auto mt-5 max-w-xl text-muted">Hôtels, restaurants, particuliers : nous concevons des pièces uniques à vos dimensions et couleurs. Devis gratuit sous 48 h.</p>
              <ButtonLink href="/sur-mesure" size="lg" className="mt-10">Démarrer mon projet <IconArrow width={18} height={18} /></ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
