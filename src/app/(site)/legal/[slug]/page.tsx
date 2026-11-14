import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { Container, PageHeader } from "@/components/ui";

const TITLES: Record<string, string> = {
  cgv: "Conditions générales de vente",
  confidentialite: "Politique de confidentialité",
  "livraison-retours": "Livraison & retours",
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: TITLES[slug] ?? "Informations" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!TITLES[slug]) notFound();
  const s = await getSettings();
  const name = s.store.name;
  const sections: Record<string, [string, string][]> = {
    cgv: [
      ["Objet", `Les présentes conditions régissent les ventes conclues sur le site ${name} entre ${name} et tout client, particulier ou professionnel.`],
      ["Prix", "Les prix sont indiqués en dinars tunisiens (DT), toutes taxes comprises. Les frais de livraison sont indiqués avant la validation de la commande."],
      ["Commande", "La commande est ferme après validation du récapitulatif et confirmation par notre équipe (par téléphone ou e-mail). Nous nous réservons le droit d'annuler une commande en cas de stock insuffisant ou de coordonnées erronées."],
      ["Paiement", "Le paiement s'effectue à la livraison en espèces, ou par virement bancaire / D17 lorsque ces options sont proposées. Les pièces sur commande peuvent nécessiter un acompte."],
      ["Livraison", `La livraison est assurée partout en Tunisie en ${s.shipping.deliveryDays} pour les articles en stock.`],
      ["Rétractation et retours", "Vous disposez de 7 jours à compter de la réception pour retourner un article en stock, non utilisé et dans son emballage d'origine. Les frais de retour sont à votre charge. Les pièces personnalisées ou sur mesure ne peuvent être retournées."],
      ["Garantie", "Nos produits bénéficient de la garantie légale contre les défauts de fabrication. Les dommages liés à une mauvaise utilisation (chaleur excessive, ampoule non conforme) sont exclus."],
      ["Litiges", "Les présentes conditions sont soumises au droit tunisien. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire."],
    ],
    confidentialite: [
      ["Données collectées", "Nous collectons uniquement les données nécessaires au traitement de vos commandes et demandes : nom, e-mail, téléphone, adresse de livraison."],
      ["Utilisation", "Vos données servent à traiter et livrer vos commandes, répondre à vos demandes et, si vous y avez consenti, vous envoyer notre lettre d'information. Elles ne sont jamais vendues."],
      ["Conservation", "Les données de commande sont conservées pendant la durée légale de conservation des documents comptables."],
      ["Sécurité", "Les mots de passe sont chiffrés (hachage scrypt) et les échanges sont protégés par HTTPS. Les fichiers envoyés pour les demandes sur mesure ne sont accessibles qu'à notre équipe."],
      ["Cookies", "Le site utilise uniquement un cookie de session (connexion) et le stockage local de votre navigateur pour le panier. Aucun cookie publicitaire."],
      ["Vos droits", `Conformément à la loi organique n° 2004-63, vous pouvez accéder à vos données, les rectifier ou demander leur suppression en écrivant à ${s.store.email}.`],
    ],
    "livraison-retours": [
      ["Zones et délais", `Nous livrons dans les 24 gouvernorats de Tunisie en ${s.shipping.deliveryDays} pour les articles en stock. Les pièces sur commande sont expédiées à l'issue du délai de fabrication indiqué.`],
      ["Frais", s.shipping.freeThresholdMinor > 0 ? `${formatPrice(s.shipping.feeMinor)} par commande, offerts dès ${formatPrice(s.shipping.freeThresholdMinor)} d'achat.` : `${formatPrice(s.shipping.feeMinor)} par commande.`],
      ["Réception", "Vérifiez votre colis en présence du livreur. En cas de dommage, refusez le colis ou émettez des réserves et contactez-nous sous 48 h avec des photos."],
      ["Retours", "Vous disposez de 7 jours après réception pour nous retourner un article en stock, non utilisé et dans son emballage d'origine. Le remboursement est effectué sous 14 jours après réception du retour."],
    ],
  };
  return (
    <>
      <PageHeader eyebrow="Informations" title={TITLES[slug]} />
      <Container className="max-w-3xl py-16">
        <div className="space-y-10">
          {sections[slug].map(([t, body], i) => (
            <section key={t}>
              <h2 className="font-display text-2xl font-light">{i + 1}. {t}</h2>
              <p className="mt-3 leading-relaxed text-muted">{body}</p>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
