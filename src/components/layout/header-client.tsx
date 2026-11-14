"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cart, lineCount, useCart } from "@/components/shop/cart-store";
import { IconBag, IconMenu, IconX } from "@/components/icons";
import { Logo } from "./logo";

export function CartButton() {
  const state = useCart();
  const n = lineCount(state);
  return (
    <button
      type="button"
      onClick={() => cart.open()}
      className="relative grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
      aria-label={`Panier (${n} article${n > 1 ? "s" : ""})`}
    >
      <IconBag />
      {n > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] leading-5 font-bold text-accent-ink tabular-nums">
          {n}
        </span>
      ) : null}
    </button>
  );
}

export function SearchBox({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
        aria-label="Rechercher"
      >
        {children}
      </button>
      {open
        ? createPortal(
            <div className="fade-in fixed inset-0 z-50 bg-bg/85 backdrop-blur-md" onClick={() => setOpen(false)} role="dialog" aria-modal aria-label="Recherche">
              <form
                className="mx-auto mt-24 max-w-2xl px-4"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = input.current?.value.trim();
                  setOpen(false);
                  router.push(q ? `/boutique?q=${encodeURIComponent(q)}` : "/boutique");
                }}
              >
                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.28em] text-accent" htmlFor="site-search">
                  Rechercher
                </label>
                <div className="flex items-center gap-3 border-b border-border-strong pb-3">
                  <input
                    id="site-search"
                    ref={input}
                    name="q"
                    placeholder="Lampe, suspension, art mural…"
                    className="w-full bg-transparent font-display text-3xl font-light placeholder:text-subtle focus:outline-none sm:text-4xl"
                    onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                  />
                  <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-fg" aria-label="Fermer">
                    <IconX />
                  </button>
                </div>
                <p className="mt-3 text-sm text-subtle">Appuyez sur Entrée pour rechercher</p>
              </form>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // Close the menu on navigation (adjusting state during render, as recommended by React).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="-ml-2 grid size-10 place-items-center rounded-full text-muted hover:text-fg lg:hidden" aria-label="Ouvrir le menu">
        <IconMenu />
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Menu">
              <div className="fade-in absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
              <div className="drawer-left absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-surface p-6 shadow-2xl">
                <div className="mb-10 flex items-center justify-between">
                  <Logo />
                  <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full text-muted hover:text-fg" aria-label="Fermer le menu">
                    <IconX />
                  </button>
                </div>
                <nav className="flex flex-col">
                  {nav.map((n) => (
                    <Link key={n.href} href={n.href} className="border-b border-border py-4 font-display text-2xl font-light text-fg/90 hover:text-accent">
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-2 pt-8 text-sm text-muted">
                  <Link href="/compte" className="block py-1 hover:text-fg">Mon compte</Link>
                  <Link href="/suivi-commande" className="block py-1 hover:text-fg">Suivre une commande</Link>
                  <Link href="/contact" className="block py-1 hover:text-fg">Contact</Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
