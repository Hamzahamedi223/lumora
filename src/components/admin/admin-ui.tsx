import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export function AdminHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back ? <Link href={back.href} className="mb-3 inline-block text-sm text-muted hover:text-fg">← {back.label}</Link> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, actions, children, className, bodyClass }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-xs tracking-wide text-subtle uppercase">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {empty ? <p className="px-4 py-12 text-center text-sm text-muted">Aucun résultat.</p> : null}
    </div>
  );
}

export const td = "px-4 py-3 align-middle";

export function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-subtle">—</span>;
  const up = value >= 0;
  return (
    <span className={cn("text-xs font-semibold tabular-nums", up ? "text-success" : "text-danger")}>
      {up ? "▲" : "▼"} {Math.abs(value)} %
    </span>
  );
}

export function FilterTabs({ items, active }: { items: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={cn("rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap", active === i.key ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:text-fg")}
        >
          {i.label}
          {i.count != null ? <span className="ml-1.5 text-subtle tabular-nums">{i.count}</span> : null}
        </Link>
      ))}
    </div>
  );
}
