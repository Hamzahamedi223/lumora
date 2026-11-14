import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <AdminHeader back={{ href: "/admin/produits", label: "Produits" }} title="Nouveau produit" />
      <ProductForm categories={categories} />
    </>
  );
}
