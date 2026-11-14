"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Oups</p>
        <h1 className="mt-4 font-display text-4xl font-light">Une erreur inattendue est survenue</h1>
        <p className="mt-3 text-muted">Merci de réessayer. Si le problème persiste, contactez-nous.</p>
        {error.digest ? <p className="mt-2 text-xs text-subtle">Réf. {error.digest}</p> : null}
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink">Réessayer</button>
          <Link href="/" className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-semibold">Accueil</Link>
        </div>
      </div>
    </div>
  );
}
