"use client";

import { useEffect, useState } from "react";
import { priceCartAction } from "@/server/actions/public";
import { cart, toLines, type CartItem } from "./cart-store";

export type PricedCart = Awaited<ReturnType<typeof priceCartAction>>;

/**
 * Asks the server for authoritative prices / stock whenever the cart content or coupon changes,
 * then aligns the local cart with the answer (removed items, reduced quantities, new prices).
 */
export function usePricedCart(items: CartItem[], coupon: string, enabled = true) {
  const key = JSON.stringify([toLines(items), coupon]);
  const [result, setResult] = useState<{ key: string; data: PricedCart | null; error: boolean } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const [lines, c] = JSON.parse(key) as [ReturnType<typeof toLines>, string];
    const timer = setTimeout(() => {
      priceCartAction(lines, c)
        .then((data) => {
          if (cancelled) return;
          setResult({ key, data, error: false });
          cart.sync(data.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, priceMinor: i.unitPriceMinor })));
        })
        .catch(() => {
          if (!cancelled) setResult({ key, data: null, error: true });
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, enabled]);

  const fresh = result?.key === key;
  return { data: result?.data ?? null, loading: enabled && !fresh, error: fresh && !!result?.error };
}
