import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getCategories } from "@/server/catalog";
import { IconSearch, IconUser } from "@/components/icons";
import { CartButton, MobileMenu, SearchBox } from "./header-client";
import { Logo } from "./logo";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const nav = [
    { href: "/boutique", label: "Boutique" },
    ...categories.map((c) => ({ href: `/boutique/${c.slug}`, label: c.name })),
    { href: "/sur-mesure", label: "Sur mesure" },
    { href: "/a-propos", label: "L'atelier" },
  ];
  return (
    <>
      {settings.store.announcement ? (
        <div className="relative z-40 border-b border-border bg-surface text-center text-xs tracking-wide text-muted">
          <p className="mx-auto max-w-7xl px-4 py-2.5">{settings.store.announcement}</p>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-18 lg:px-8">
          <MobileMenu nav={nav} />
          <Link href="/" className="shrink-0" aria-label="Lumora — accueil">
            <Logo />
          </Link>
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <SearchBox>
              <IconSearch />
            </SearchBox>
            <Link href="/compte" className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg" aria-label="Mon compte">
              <IconUser />
            </Link>
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
