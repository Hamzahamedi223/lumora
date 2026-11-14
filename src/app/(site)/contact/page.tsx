import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { Container, PageHeader } from "@/components/ui";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact", description: "Une question, une commande professionnelle ? Écrivez-nous." };

export default async function ContactPage() {
  const s = (await getSettings()).store;
  const items = [
    ["E-mail", s.email, `mailto:${s.email}`],
    ["Téléphone", s.phone, `tel:${s.phone.replace(/\s/g, "")}`],
    ["WhatsApp", s.whatsapp ? `+${s.whatsapp.replace(/\D/g, "")}` : "", s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, "")}` : ""],
    ["Atelier", s.address, ""],
  ].filter(([, v]) => v);
  return (
    <>
      <PageHeader eyebrow="Contact" title="Parlons lumière" intro="Une question sur une pièce, une commande professionnelle, un partenariat ? Nous répondons sous 24 h ouvrées." />
      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
        <dl className="space-y-6">
          {items.map(([k, v, href]) => (
            <div key={k} className="border-b border-border pb-6">
              <dt className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">{k}</dt>
              <dd className="mt-2 font-display text-2xl font-light">{href ? <a href={href} className="hover:text-accent">{v}</a> : v}</dd>
            </div>
          ))}
          <p className="text-sm text-muted">Du lundi au samedi, 9 h – 18 h.</p>
        </dl>
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
