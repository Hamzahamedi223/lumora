import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Suivre ma commande" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Suivi" title="Où en est ma commande ?" intro="Saisissez votre numéro de commande (reçu par e-mail) et l'e-mail ou le téléphone utilisé lors de la commande." />
      <Container className="max-w-xl py-16">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <TrackForm defaultNumber={n} />
        </div>
      </Container>
    </>
  );
}
