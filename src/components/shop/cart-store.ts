"use client";

import { useSyncExternalStore } from "react";

/**
 * Client cart: stored in localStorage, shared across tabs.
 * The snapshot fields are only for instant display — prices and stock are always re-checked on the server.
 */
export type CartItem = {
  variantId: string;
  quantity: number;
  slug: string;
  name: string;
  variantName: string;
  priceMinor: number;
  image: string | null;
};

type State = { items: CartItem[]; open: boolean; coupon: string };

const KEY = "lumora_cart_v1";
const EMPTY: State = { items: [], open: false, coupon: "" };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && Array.isArray(raw.items)) {
      state = {
        open: false,
        coupon: typeof raw.coupon === "string" ? raw.coupon : "",
        items: raw.items.filter((i: CartItem) => i && typeof i.variantId === "string" && Number.isFinite(i.quantity) && i.quantity > 0),
      };
    }
  } catch {
    /* corrupted or blocked storage: start empty */
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items: state.items, coupon: state.coupon }));
  } catch {
    /* storage full or blocked */
  }
}

function emit() {
  for (const l of listeners) l();
}

function set(next: Partial<State>, save = true) {
  load();
  state = { ...state, ...next };
  if (save) persist();
  emit();
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    load();
    const existing = state.items.find((i) => i.variantId === item.variantId);
    const items = existing
      ? state.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity: Math.min(10, i.quantity + quantity) } : i))
      : [...state.items, { ...item, quantity: Math.min(10, quantity) }];
    set({ items, open: true });
  },
  setQuantity(variantId: string, quantity: number) {
    load();
    set({ items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(10, quantity)) } : i)) });
  },
  remove(variantId: string) {
    load();
    set({ items: state.items.filter((i) => i.variantId !== variantId) });
  },
  /** Align local quantities with what the server says is available. */
  sync(server: { variantId: string; quantity: number; priceMinor: number }[]) {
    load();
    const items = state.items
      .map((i) => {
        const s = server.find((x) => x.variantId === i.variantId);
        return s ? { ...i, quantity: s.quantity, priceMinor: s.priceMinor } : null;
      })
      .filter((x): x is CartItem => x !== null);
    const changed =
      items.length !== state.items.length || items.some((i, k) => i.quantity !== state.items[k].quantity || i.priceMinor !== state.items[k].priceMinor);
    if (changed) set({ items });
  },
  setCoupon(coupon: string) {
    set({ coupon: coupon.trim().toUpperCase() });
  },
  clear() {
    set({ items: [], coupon: "" });
  },
  open() {
    set({ open: true }, false);
  },
  close() {
    set({ open: false }, false);
  },
};

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}
const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => EMPTY;

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const lineCount = (s: State) => s.items.reduce((n, i) => n + i.quantity, 0);
export const toLines = (items: CartItem[]) => items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
