"use client";

import Image from "next/image";
import { useState } from "react";
import { cart } from "./cart-store";
import type { PricedCart } from "./use-priced-cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/components/ui";

export function CouponBox({ coupon, data }: { coupon: string; data: PricedCart | null }) {
  const [value, setValue] = useState(coupon);
  if (coupon && data?.coupon)
    return (
      <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
        <span className="text-success">Code <b>{data.coupon.code}</b> appliqué ({data.coupon.label})</span>
        <button type="button" onClick={() => { cart.setCoupon(""); setValue(""); }} className="text-xs text-muted underline hover:text-fg">Retirer</button>
      </div>
    );
  return (
    <div>
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">Code promo</label>
        <input
          id="coupon"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              cart.setCoupon(value);
            }
          }}
          placeholder="Code promo"
          maxLength={40}
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm uppercase placeholder:normal-case placeholder:text-subtle focus:border-accent/60 focus:outline-none"
        />
        <button type="button" onClick={() => cart.setCoupon(value)} disabled={!value.trim()} className="h-11 rounded-full bg-surface-3 px-5 text-sm font-semibold hover:bg-border-strong disabled:opacity-50">
          Appliquer
        </button>
      </div>
      {coupon && data?.couponError ? <p className="mt-2 px-1 text-xs text-danger" role="alert">{data.couponError}</p> : null}
    </div>
  );
}

export function Totals({ data, loading }: { data: PricedCart | null; loading: boolean }) {
  if (!data) return <div className="h-32 animate-pulse rounded-xl bg-surface-2" />;
  return (
    <dl className={cn("space-y-3 text-sm transition-opacity", loading && "opacity-50")}>
      <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{formatPrice(data.subtotalMinor)}</dd></div>
      {data.discountMinor > 0 ? (
        <div className="flex justify-between text-success"><dt>Remise {data.coupon?.code}</dt><dd className="tabular-nums">-{formatPrice(data.discountMinor)}</dd></div>
      ) : null}
      <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd className="tabular-nums">{data.shippingMinor === 0 ? <span className="text-success">Offerte</span> : formatPrice(data.shippingMinor)}</dd></div>
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <dt className="font-medium">Total</dt>
        <dd className="text-xl font-semibold tabular-nums">{formatPrice(data.totalMinor)}</dd>
      </div>
      <p className="text-right text-xs text-subtle">TVA incluse</p>
    </dl>
  );
}

export function SummaryItems({ data }: { data: PricedCart | null }) {
  if (!data) return null;
  return (
    <ul className="divide-y divide-border">
      {data.items.map((i) => (
        <li key={i.variantId} className="flex items-center gap-4 py-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
            {i.image ? <Image src={i.image} alt="" fill sizes="64px" className="object-cover" /> : null}
            <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-bg/80 px-1 text-[11px] font-bold tabular-nums">{i.quantity}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{i.name}</span>
            <span className="block text-xs text-muted">{i.variantName}{i.madeToOrder ? ` · sur commande${i.leadTimeDays ? ` (${i.leadTimeDays} j)` : ""}` : ""}</span>
          </span>
          <span className="text-sm tabular-nums">{formatPrice(i.lineTotalMinor)}</span>
        </li>
      ))}
    </ul>
  );
}
