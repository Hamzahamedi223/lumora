import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/server/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const statics = ["", "/boutique", "/sur-mesure", "/a-propos", "/contact", "/faq", "/legal/cgv", "/legal/confidentialite", "/legal/livraison-retours"];
  try {
    const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);
    return [
      ...statics.map((p) => ({ url: `${base}${p}` })),
      ...categories.map((c) => ({ url: `${base}/boutique/${c.slug}` })),
      ...products.map((p) => ({ url: `${base}/produits/${p.slug}`, lastModified: new Date(p.updatedAt) })),
    ];
  } catch {
    return statics.map((p) => ({ url: `${base}${p}` }));
  }
}
