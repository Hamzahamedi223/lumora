"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cart, useCart, type CartItem } from "./cart-store";
import { usePricedCart } from "./use-priced-cart";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui";
import { IconMinus, IconPlus, IconTrash, IconX } from "@/components/icons";

export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const left = threshold - subtotal;
  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        {left > 0 ? (
          <>
            Plus que <span className="font-semibold text-fg">{formatPrice(left)}</span> pour la livraison offerte
          </>
        ) : (
          <span className="text-success">Livraison offerte ✓</span>
        )}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QtyStepper({ item, max }: { item: CartItem; max?: number }) {
  const limit = Math.min(10, max ?? 10);
  return (
    <div className="inline-flex items-center rounded-full border border-border">
      <button type="button" className="grid size-8 place-items-center text-muted hover:text-fg disabled:opacity-30" onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Diminuer la quantité">
        <IconMinus width={14} height={14} />
      </button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
      <button type="button" className="grid size-8 place-items-center text-muted hover:text-fg disabled:opacity-30" onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= limit} aria-label="Augmenter la quantité">
        <IconPlus width={14} height={14} />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const state = useCart();
  const pathname = usePathname();
  const { data, loading } = usePricedCart(state.items, state.coupon, state.open);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open]);

  useEffect(() => {
    cart.close();
  }, [pathname]);

  if (!state.open) return null;
  const subtotal = data?.subtotalMinor ?? state.items.reduce((s, i) => s + i.priceMinor * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="Panier">
      <div className="fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => cart.close()} />
      <aside className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <p className="font-display text-2xl font-light">Votre panier</p>
          <button type="button" onClick={() => cart.close()} className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fermer le panier">
            <IconX />
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="lamp-glow mb-6 size-24 rounded-full" />
            <p className="font-display text-2xl font-light">Votre panier est vide</p>
            <p className="mt-2 text-sm text-muted">Laissez-vous guider par la lumière.</p>
            <Link href="/boutique" className={buttonClass("primary", "md", "mt-6")}>Découvrir la collection</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-6 py-4">
              <FreeShippingBar subtotal={subtotal} threshold={data?.freeShippingThresholdMinor ?? 0} />
            </div>
            {data?.issues.length ? (
              <div className="border-b border-border bg-warning/10 px-6 py-3 text-xs text-warning">{data.issues.map((m) => <p key={m}>{m}</p>)}</div>
            ) : null}
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {state.items.map((item) => {
                const live = data?.items.find((i) => i.variantId === item.variantId);
                return (
                  <li key={item.variantId} className="flex gap-4 py-5">
                    <Link href={`/produits/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      {item.image ? <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" /> : null}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/produits/${item.slug}`} className="block truncate font-medium hover:text-accent">{item.name}</Link>
                          <p className="text-xs text-muted">{item.variantName}</p>
                        </div>
                        <button type="button" onClick={() => cart.remove(item.variantId)} className="text-subtle hover:text-danger" aria-label={`Retirer ${item.name}`}>
                          <IconTrash width={16} height={16} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <QtyStepper item={item} max={live?.available} />
                        <span className="text-sm font-semibold tabular-nums">{formatPrice((live?.unitPriceMinor ?? item.priceMinor) * item.quantity)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-4 border-t border-border px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Sous-total</span>
                <span className={`text-lg font-semibold tabular-nums transition-opacity ${loading ? "opacity-50" : ""}`}>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-subtle">Livraison et codes promo calculés à l&apos;étape suivante.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/panier" className={buttonClass("secondary", "md")}>Voir le panier</Link>
                <Link href="/commande" className={buttonClass("primary", "md")}>Commander</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
