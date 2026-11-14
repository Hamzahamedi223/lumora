import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
    size === "sm" && "h-9 px-4 text-sm",
    size === "md" && "h-11 px-6 text-sm",
    size === "lg" && "h-13 px-8 text-base",
    variant === "primary" && "bg-accent text-accent-ink hover:bg-accent-strong shadow-[0_8px_30px_-10px_rgb(232_176_98/0.6)]",
    variant === "secondary" && "border border-border-strong bg-surface-2/60 text-fg hover:border-accent/60 hover:bg-surface-3",
    variant === "ghost" && "text-muted hover:text-fg hover:bg-surface-2",
    variant === "danger" && "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
    extra,
  );
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-subtle transition focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 aria-[invalid=true]:border-danger/70";

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-subtle">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, className)} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={cn(inputClass, "resize-y", className)} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a5978a%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_1rem_center] bg-no-repeat pr-10", className)} />;
}

const TONES: Record<Tone, string> = {
  amber: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  blue: "bg-sky-400/10 text-sky-300 ring-sky-400/25",
  violet: "bg-violet-400/10 text-violet-300 ring-violet-400/25",
  green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  red: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  zinc: "bg-zinc-400/10 text-zinc-300 ring-zinc-400/25",
};

export function Badge({ tone = "zinc", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONES[tone], className)}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-border bg-surface", className)}>{children}</div>;
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-accent", className)} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(value) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8l-4.3-4 5.8-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function Price({ minor, compareAt, className }: { minor: number; compareAt?: number | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold tabular-nums">{formatPrice(minor)}</span>
      {compareAt && compareAt > minor ? <span className="text-sm text-subtle line-through tabular-nums">{formatPrice(compareAt)}</span> : null}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold uppercase tracking-[0.28em] text-accent", className)}>{children}</p>;
}

export function SectionTitle({ eyebrow, title, intro, align = "left" }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; align?: "left" | "center" }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
      <h2 className="font-display text-3xl leading-tight font-light tracking-tight text-balance sm:text-4xl md:text-5xl">{title}</h2>
      {intro ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted">{intro}</p> : null}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="lamp-glow mb-6 size-20 rounded-full" />
      <p className="font-display text-2xl font-light">{title}</p>
      {text ? <p className="mt-2 max-w-sm text-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="lamp-glow pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 opacity-60" />
      <Container className="relative py-14 sm:py-20">
        {eyebrow ? <Eyebrow className="reveal mb-4">{eyebrow}</Eyebrow> : null}
        <h1 className="reveal reveal-1 font-display text-4xl font-light tracking-tight text-balance sm:text-5xl md:text-6xl">{title}</h1>
        {intro ? <p className="reveal reveal-2 mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted">{intro}</p> : null}
      </Container>
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)} className={buttonClass("secondary", "sm")} rel="prev">←</Link> : null}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 ? <span className="px-1 text-subtle">…</span> : null}
          <Link href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("grid size-9 place-items-center rounded-full text-sm tabular-nums", n === page ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-fg")}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? <Link href={href(page + 1)} className={buttonClass("secondary", "sm")} rel="next">→</Link> : null}
    </nav>
  );
}
