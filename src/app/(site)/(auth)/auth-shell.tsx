import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({ title, intro, children, footer }: { title: string; intro?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div className="relative hidden overflow-hidden rounded-[2rem] border border-border lg:block">
        <Image src="/catalog/halo-lit.webp" alt="" fill sizes="50vw" className="object-cover" />
      </div>
      <div className="mx-auto w-full max-w-md self-center">
        <h1 className="font-display text-4xl font-light tracking-tight">{title}</h1>
        {intro ? <p className="mt-3 text-muted">{intro}</p> : null}
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8 border-t border-border pt-6 text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
