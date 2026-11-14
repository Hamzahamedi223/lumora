"use client";

import { useRouter } from "next/navigation";

const LABEL: Record<string, string> = {
  new: "Nouveautés",
  "price-asc": "Prix croissant",
  "price-desc": "Prix décroissant",
  popular: "Meilleures ventes",
};

export function SortSelect({ value, options }: { value: string; options: { value: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Trier
      <select
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.value === e.target.value);
          if (o) router.push(o.href, { scroll: false });
        }}
        className="h-10 rounded-full border border-border bg-surface px-4 text-sm text-fg focus:border-accent/60 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{LABEL[o.value]}</option>
        ))}
      </select>
    </label>
  );
}
