import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";

export type StoreSettings = {
  store: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    announcement: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  shipping: { feeMinor: number; freeThresholdMinor: number; deliveryDays: string };
  payments: { cod: boolean; bankTransfer: boolean; d17: boolean; bankDetails: string; d17Number: string };
};

export const DEFAULT_SETTINGS: StoreSettings = {
  store: {
    name: "Lumora",
    tagline: "Luminaires & art mural imprimés en 3D, fabriqués en Tunisie",
    email: "contact@lumora.tn",
    phone: "+216 20 000 000",
    whatsapp: "21620000000",
    address: "Tunis, Tunisie",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "",
    announcement: "Livraison offerte dès 200 DT d'achat — partout en Tunisie",
    heroTitle: "La lumière, sculptée couche par couche.",
    heroSubtitle:
      "Des luminaires et pièces murales imprimés en 3D à partir de matériaux biosourcés, dessinés et fabriqués à la main dans notre atelier tunisien.",
  },
  shipping: { feeMinor: 8000, freeThresholdMinor: 200000, deliveryDays: "2 à 4 jours ouvrés" },
  payments: { cod: true, bankTransfer: true, d17: false, bankDetails: "", d17Number: "" },
};

export const SETTINGS_TAG = "settings";

/** Deep-merges stored values over defaults so new keys never break older rows. */
function merge(stored: unknown): StoreSettings {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<StoreSettings>;
  return {
    store: { ...DEFAULT_SETTINGS.store, ...(s.store ?? {}) },
    shipping: { ...DEFAULT_SETTINGS.shipping, ...(s.shipping ?? {}) },
    payments: { ...DEFAULT_SETTINGS.payments, ...(s.payments ?? {}) },
  };
}

export async function readSettingsUncached(): Promise<StoreSettings> {
  const row = await db.setting.findUnique({ where: { key: "store" } });
  return merge(row?.value);
}

export const getSettings = unstable_cache(readSettingsUncached, ["settings-v1"], { tags: [SETTINGS_TAG], revalidate: 3600 });

export function shippingFor(subtotalMinor: number, s: StoreSettings["shipping"]): number {
  if (subtotalMinor <= 0) return 0;
  if (s.freeThresholdMinor > 0 && subtotalMinor >= s.freeThresholdMinor) return 0;
  return s.feeMinor;
}
