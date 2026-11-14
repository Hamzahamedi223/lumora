import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Questions fréquentes" };

export default async function FaqPage() {
  const s = await getSettings();
  const faqs: [string, string][] = [
    ["Quels sont les délais de livraison ?", `Les pièces en stock sont expédiées sous 48 h et livrées en ${s.shipping.deliveryDays} partout en Tunisie. Les pièces « sur commande » indiquent leur délai de fabrication sur la fiche produit.`],
    ["Combien coûte la livraison ?", s.shipping.freeThresholdMinor > 0 ? `${formatPrice(s.shipping.feeMinor)} partout en Tunisie, offerte dès ${formatPrice(s.shipping.freeThresholdMinor)} d'achat.` : `${formatPrice(s.shipping.feeMinor)} partout en Tunisie.`],
    ["Comment puis-je payer ?", "En espèces à la livraison, ou par virement bancaire / D17 selon les options affichées au moment de la commande."],
    ["Les ampoules sont-elles fournies ?", "Non, sauf mention contraire. Nous recommandons des ampoules LED (2700 K pour une lumière chaude) dont la puissance est indiquée sur chaque fiche produit : elles chauffent peu et préservent la matière."],
    ["En quelle matière sont faites vos pièces ?", "En PLA, un bioplastique issu de l'amidon de maïs. Il est rigide, léger et d'aspect mat. Il ne doit pas être exposé à une forte chaleur (plus de 55 °C) ni en plein soleil derrière une vitre."],
    ["Comment entretenir ma lampe ?", "Un simple plumeau ou un chiffon microfibre sec suffit. Évitez l'eau et les produits ménagers."],
    ["Puis-je retourner un article ?", "Oui, vous disposez de 7 jours après réception pour nous retourner un article en stock non utilisé, dans son emballage d'origine. Les pièces sur mesure ne sont ni reprises ni échangées."],
    ["Faites-vous des pièces sur mesure ou pour les professionnels ?", "Oui ! Hôtels, restaurants, architectes et particuliers : décrivez votre projet sur la page Sur mesure, nous répondons sous 48 h avec un devis gratuit."],
  ];
  return (
    <>
      <PageHeader eyebrow="Aide" title="Questions fréquentes" />
      <Container className="max-w-3xl py-16">
        <div className="divide-y divide-border border-y border-border">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-xl font-light [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-2xl text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </>
  );
}
