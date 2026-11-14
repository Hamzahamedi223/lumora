import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ShopView, type SearchParams } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Toute la collection Lumora : lampes à poser, suspensions et art mural imprimés en 3D en Tunisie.",
  alternates: { canonical: "/boutique" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Boutique" title="La collection" intro="Luminaires et pièces murales imprimés en 3D, dessinés et fabriqués dans notre atelier tunisien." />
      <ShopView sp={sp} />
    </>
  );
}
