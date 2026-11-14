import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow, PageHeader } from "@/components/ui";
import { CustomRequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Création sur mesure",
  description: "Luminaires et art mural sur mesure pour particuliers, hôtels et restaurants. Devis gratuit sous 48 h.",
};

const STEPS = [
  ["Votre idée", "Décrivez votre projet, vos dimensions, vos couleurs. Ajoutez des photos d'inspiration."],
  ["Proposition & devis", "Sous 48 h, nous vous envoyons une proposition et un devis détaillé, sans engagement."],
  ["Prototype 3D", "Nous modélisons la pièce et validons ensemble le rendu avant fabrication."],
  ["Fabrication & livraison", "Impression, finitions à la main, contrôle qualité, puis livraison partout en Tunisie."],
];

export default function CustomPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sur mesure"
        title={<>Votre lumière, <span className="italic text-accent">à votre image</span></>}
        intro="Une suspension XL pour un restaurant, une série de lampes pour un hôtel, une pièce murale unique pour votre salon : notre atelier conçoit avec vous des objets qui n'existent nulle part ailleurs."
      />
      <Container className="py-16">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-border bg-surface p-6">
              <span className="font-display text-4xl font-light text-accent">0{i + 1}</span>
              <p className="mt-4 font-medium">{t}</p>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            <Eyebrow>Démarrer</Eyebrow>
            <h2 className="font-display text-4xl font-light tracking-tight">Parlez-nous de votre projet</h2>
            <p className="text-muted">Plus vous donnez de détails, plus notre proposition sera précise. Les photos d&apos;inspiration, croquis ou plans sont les bienvenus.</p>
            <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl border border-border lg:block">
              <Image src="/catalog/dune-lit.webp" alt="Suspension Dune" fill sizes="40vw" className="object-cover" />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <CustomRequestForm />
          </div>
        </div>
      </Container>
    </>
  );
}
