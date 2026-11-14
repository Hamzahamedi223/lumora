"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

type Counts = { orders: number; requests: number; reviews: number; messages: number };

export function AdminNav({ counts }: { counts: Counts }) {
  const path = usePathname();
  const items: { href: string; label: string; count?: number; group?: string }[] = [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/admin/commandes", label: "Commandes", count: counts.orders },
    { href: "/admin/sur-mesure", label: "Sur mesure", count: counts.requests },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/produits", label: "Produits", group: "Catalogue" },
    { href: "/admin/stock", label: "Stock" },
    { href: "/admin/categories", label: "Catégories" },
    { href: "/admin/coupons", label: "Codes promo" },
    { href: "/admin/avis", label: "Avis", count: counts.reviews },
    { href: "/admin/messages", label: "Messages", count: counts.messages, group: "Boutique" },
    { href: "/admin/parametres", label: "Paramètres" },
  ];
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Administration">
      {items.map((i) => (
        <div key={i.href} className="contents">
          {i.group ? <p className="mt-5 mb-1 hidden px-3 text-[11px] font-semibold tracking-[0.2em] text-subtle uppercase lg:block">{i.group}</p> : null}
          <Link
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition",
              active(i.href) ? "bg-surface-3 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {i.label}
            {i.count ? <span className="rounded-full bg-accent px-1.5 text-[11px] leading-5 font-bold text-accent-ink tabular-nums">{i.count}</span> : null}
          </Link>
        </div>
      ))}
    </nav>
  );
}
