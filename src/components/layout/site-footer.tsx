import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getCategories } from "@/server/catalog";
import { IconFacebook, IconInstagram, IconWhatsapp } from "@/components/icons";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

export async function SiteFooter() {
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const cols = [
    {
      title: "Boutique",
      links: [{ href: "/boutique", label: "Toute la collection" }, ...categories.map((c) => ({ href: `/boutique/${c.slug}`, label: c.name })), { href: "/boutique?promo=1", label: "Offres" }],
    },
    {
      title: "Lumora",
      links: [
        { href: "/a-propos", label: "L'atelier" },
        { href: "/sur-mesure", label: "Création sur mesure" },
        { href: "/faq", label: "Questions fréquentes" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Aide",
      links: [
        { href: "/suivi-commande", label: "Suivre ma commande" },
        { href: "/legal/livraison-retours", label: "Livraison & retours" },
        { href: "/legal/cgv", label: "Conditions générales de vente" },
        { href: "/legal/confidentialite", label: "Confidentialité" },
      ],
    },
  ];
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted">{s.store.tagline}</p>
            <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fg">Lettre de lumière</p>
            <p className="mb-4 text-sm text-muted">Nouvelles collections, pièces limitées et offres en avant-première.</p>
            <NewsletterForm />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-fg">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-muted transition hover:text-accent">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="hairline my-10" />
        <div className="flex flex-col items-start justify-between gap-6 text-xs text-subtle sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} {s.store.name}. Conçu et fabriqué en Tunisie.</p>
            <p>{s.store.address} · {s.store.phone} · {s.store.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {s.store.instagram ? <a href={s.store.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-full border border-border text-muted hover:border-accent/60 hover:text-accent"><IconInstagram width={16} height={16} /></a> : null}
            {s.store.facebook ? <a href={s.store.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-full border border-border text-muted hover:border-accent/60 hover:text-accent"><IconFacebook width={16} height={16} /></a> : null}
            {s.store.whatsapp ? <a href={`https://wa.me/${s.store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-9 place-items-center rounded-full border border-border text-muted hover:border-accent/60 hover:text-accent"><IconWhatsapp width={16} height={16} /></a> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
