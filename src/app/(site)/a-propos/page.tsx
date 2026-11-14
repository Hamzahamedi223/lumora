import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, Container, PageHeader, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "L'atelier", description: "Lumora, un atelier tunisien de design et d'impression 3D dédié à la lumière." };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="L'atelier"
        title={<>Né à Tunis, <span className="italic text-accent">façonné par la lumière</span></>}
        intro="Lumora est un atelier de design tunisien qui explore ce que l'impression 3D peut apporter à l'objet du quotidien : des formes impossibles à obtenir autrement, fabriquées localement, à la demande, sans gaspillage."
      />
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border">
          <Image src="/catalog/torsade-lit.webp" alt="Lampe Torsade" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="space-y-6 text-muted">
          <SectionTitle eyebrow="Notre démarche" title="Moins, mais mieux" />
          <p>Chaque pièce est dessinée dans notre studio, puis imprimée couche par couche — parfois plus de 30 heures pour une seule suspension. Nous utilisons un PLA d&apos;origine végétale, issu de l&apos;amidon de maïs, et produisons principalement à la commande pour éviter les stocks inutiles.</p>
          <p>Nos formes puisent dans le patrimoine tunisien — moucharabiehs de la médina, bleu de Sidi Bou Saïd, dunes du Sud — réinterprété avec un regard contemporain.</p>
          <p>Après impression, chaque objet est poncé, assemblé et contrôlé à la main, puis emballé avec soin dans des cartons recyclés.</p>
          <ButtonLink href="/boutique" className="mt-4">Découvrir la collection</ButtonLink>
        </div>
      </Container>
      <section className="border-t border-border py-20">
        <Container className="grid gap-6 sm:grid-cols-3">
          {[
            ["30 h", "d'impression pour nos plus grandes pièces"],
            ["100 %", "conçu et fabriqué en Tunisie"],
            ["0", "plastique dans nos emballages"],
          ].map(([k, v]) => (
            <div key={v} className="rounded-3xl border border-border bg-surface p-8">
              <p className="font-display text-5xl font-light text-accent">{k}</p>
              <p className="mt-3 text-muted">{v}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
