import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/produits", label: "Produits" }}
        title={product.name}
        actions={product.status === "ACTIVE" ? <Link href={`/produits/${product.slug}`} target="_blank" className={buttonClass("secondary", "sm")}>Voir sur le site ↗</Link> : null}
      />
      {sp.created ? <p className="mb-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Produit créé.</p> : null}
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          tagline: product.tagline ?? "",
          description: product.description,
          categoryId: product.categoryId ?? "",
          status: product.status,
          price: String(product.priceMinor / 1000),
          compareAt: product.compareAtMinor ? String(product.compareAtMinor / 1000) : "",
          featured: product.featured,
          isNew: product.isNew,
          madeToOrder: product.madeToOrder,
          leadTimeDays: product.leadTimeDays ? String(product.leadTimeDays) : "",
          material: product.material ?? "",
          dimensions: product.dimensions ?? "",
          bulb: product.bulb ?? "",
          weight: product.weight ?? "",
          images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? "" })),
          variants: product.variants.map((v) => ({ id: v.id, name: v.name, colorHex: v.colorHex ?? "", sku: v.sku ?? "", stock: v.stock, originalStock: v.stock, isActive: v.isActive })),
        }}
      />
    </>
  );
}
