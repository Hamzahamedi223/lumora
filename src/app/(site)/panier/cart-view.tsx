"use client";

import Image from "next/image";
import Link from "next/link";
import { cart, useCart } from "@/components/shop/cart-store";
import { usePricedCart } from "@/components/shop/use-priced-cart";
import { FreeShippingBar, QtyStepper } from "@/components/shop/cart-drawer";
import { CouponBox, Totals } from "@/components/shop/order-summary";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const state = useCart();
  const { data, loading, error } = usePricedCart(state.items, state.coupon);

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Votre panier</h1>
      {state.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Votre panier est vide" text="Découvrez nos luminaires et pièces murales." action={<ButtonLink href="/boutique">Découvrir la collection</ButtonLink>} />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            {data?.issues.length ? (
              <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">{data.issues.map((m) => <p key={m}>{m}</p>)}</div>
            ) : null}
            {error ? <p className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">Impossible de vérifier le panier. Vérifiez votre connexion.</p> : null}
            <ul className="divide-y divide-border border-y border-border">
              {state.items.map((item) => {
                const live = data?.items.find((i) => i.variantId === item.variantId);
                return (
                  <li key={item.variantId} className="flex gap-5 py-6">
                    <Link href={`/produits/${item.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-28">
                      {item.image ? <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" /> : null}
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/produits/${item.slug}`} className="font-display text-xl font-light hover:text-accent">{item.name}</Link>
                          <p className="text-sm text-muted">{item.variantName}</p>
                          <p className="mt-1 text-sm text-muted tabular-nums">{formatPrice(live?.unitPriceMinor ?? item.priceMinor)}</p>
                        </div>
                        <p className="font-semibold tabular-nums">{formatPrice((live?.unitPriceMinor ?? item.priceMinor) * item.quantity)}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <QtyStepper item={item} max={live?.available} />
                        <button type="button" onClick={() => cart.remove(item.variantId)} className="flex items-center gap-1.5 text-sm text-muted hover:text-danger">
                          <IconTrash width={16} height={16} /> Retirer
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link href="/boutique" className="mt-6 inline-block text-sm text-muted hover:text-accent">← Continuer mes achats</Link>
          </div>
          <aside className="h-fit space-y-6 rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-28">
            <FreeShippingBar subtotal={(data?.subtotalMinor ?? 0) - (data?.discountMinor ?? 0)} threshold={data?.freeShippingThresholdMinor ?? 0} />
            <CouponBox coupon={state.coupon} data={data} />
            <Totals data={data} loading={loading} />
            <ButtonLink href="/commande" size="lg" className="w-full">Passer commande</ButtonLink>
            <p className="text-center text-xs text-subtle">Paiement à la livraison disponible</p>
          </aside>
        </div>
      )}
    </Container>
  );
}
