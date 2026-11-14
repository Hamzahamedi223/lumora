import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminHeader } from "@/components/admin/admin-ui";
import { CategoryEditor } from "./category-editor";

export const metadata: Metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const cats = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <>
      <AdminHeader title="Catégories" subtitle="Elles structurent la navigation de la boutique." />
      <div className="grid gap-4 lg:grid-cols-2">
        {cats.map((c) => (
          <CategoryEditor key={`${c.id}-${c.updatedAt.toISOString()}`} category={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive, image: c.image, count: c._count.products }} />
        ))}
        <CategoryEditor />
      </div>
    </>
  );
}
