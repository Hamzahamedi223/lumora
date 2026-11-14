"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/components/ui";

export function ProductGallery({ images, name }: { images: { id: string; url: string; alt: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  if (!current) return <div className="aspect-[4/5] rounded-3xl bg-surface-2" />;
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 ? (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn("relative aspect-[4/5] w-18 shrink-0 overflow-hidden rounded-xl ring-1 transition md:w-full", i === active ? "ring-accent" : "opacity-60 ring-border hover:opacity-100")}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-surface-2">
        <Image key={current.id} src={current.url} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="fade-in object-cover" />
      </div>
    </div>
  );
}
