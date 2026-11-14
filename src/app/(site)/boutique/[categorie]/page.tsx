import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/server/catalog";
import { PageHeader } from "@/components/ui";
import { ShopView, type SearchParams } from "@/components/shop/shop-view";

type Props = { params: Promise<{ categorie: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorie } = await params;
  const c = (await getCategories()).find((x) => x.slug === categorie);
  if (!c) return {};
  return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/boutique/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ categorie }, sp] = await Promise.all([params, searchParams]);
  const c = (await getCategories()).find((x) => x.slug === categorie);
  if (!c) notFound();
  return (
    <>
      <PageHeader eyebrow="Collection" title={c.name} intro={c.description} />
      <ShopView sp={sp} category={c.slug} />
    </>
  );
}
