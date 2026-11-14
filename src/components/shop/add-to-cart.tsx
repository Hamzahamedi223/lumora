"use client";

import { useState } from "react";
import { cart } from "./cart-store";
import { Button, cn } from "@/components/ui";
import { IconMinus, IconPlus } from "@/components/icons";
import { LOW_STOCK } from "@/lib/constants";

type V = { id: string; name: string; colorHex: string | null; stock: number };

export function AddToCart({
  product,
  variants,
}: {
  product: { slug: string; name: string; priceMinor: number; image: string | null; madeToOrder: boolean; leadTimeDays: number | null };
  variants: V[];
}) {
  const firstAvailable = variants.find((v) => product.madeToOrder || v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const selected = variants.find((v) => v.id === selectedId) ?? firstAvailable;
  if (!selected) return <p className="text-sm text-muted">Ce produit n&apos;est pas disponible pour le moment.</p>;

  const max = product.madeToOrder ? 10 : Math.min(10, selected.stock);
  const out = max <= 0;
  const quantity = Math.min(qty, Math.max(1, max));

  return (
    <div className="space-y-6">
      {variants.length > 0 ? (
        <fieldset>
          <legend className="mb-3 text-sm">
            <span className="text-muted">Couleur : </span>
            <span className="font-semibold">{selected.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const unavailable = !product.madeToOrder && v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  aria-pressed={v.id === selected.id}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm transition",
                    v.id === selected.id ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
                    unavailable && "opacity-50",
                  )}
                >
                  <span className="size-6 rounded-full ring-1 ring-white/15" style={{ background: v.colorHex ?? "#888" }} />
                  {v.name}
                  {unavailable ? <span className="text-xs">· épuisé</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <p className="text-sm" aria-live="polite">
        {product.madeToOrder ? (
          <span className="text-muted">
            <span className="mr-2 inline-block size-2 rounded-full bg-accent" />
            Fabriqué sur commande{product.leadTimeDays ? ` · expédié sous ${product.leadTimeDays} jours` : ""}
          </span>
        ) : out ? (
          <span className="text-danger"><span className="mr-2 inline-block size-2 rounded-full bg-danger" />Épuisé dans cette couleur</span>
        ) : selected.stock <= LOW_STOCK ? (
          <span className="text-warning"><span className="mr-2 inline-block size-2 rounded-full bg-warning" />Plus que {selected.stock} en stock</span>
        ) : (
          <span className="text-success"><span className="mr-2 inline-block size-2 rounded-full bg-success" />En stock · expédié sous 48 h</span>
        )}
      </p>

      <div className="flex gap-3">
        <div className="inline-flex h-13 items-center rounded-full border border-border-strong">
          <button type="button" className="grid size-12 place-items-center text-muted hover:text-fg disabled:opacity-30" disabled={quantity <= 1 || out} onClick={() => setQty(quantity - 1)} aria-label="Diminuer la quantité">
            <IconMinus width={16} height={16} />
          </button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">{out ? 0 : quantity}</span>
          <button type="button" className="grid size-12 place-items-center text-muted hover:text-fg disabled:opacity-30" disabled={quantity >= max || out} onClick={() => setQty(quantity + 1)} aria-label="Augmenter la quantité">
            <IconPlus width={16} height={16} />
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          disabled={out}
          onClick={() =>
            cart.add(
              { variantId: selected.id, slug: product.slug, name: product.name, variantName: selected.name, priceMinor: product.priceMinor, image: product.image },
              quantity,
            )
          }
        >
          {out ? "Épuisé" : "Ajouter au panier"}
        </Button>
      </div>
    </div>
  );
}
