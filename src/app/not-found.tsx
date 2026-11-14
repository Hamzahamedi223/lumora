import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="lamp-glow mx-auto mb-6 size-40 rounded-full" />
        <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Erreur 404</p>
        <h1 className="mt-4 font-display text-5xl font-light">Cette page est restée dans l&apos;ombre</h1>
        <p className="mt-4 text-muted">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink">Accueil</Link>
          <Link href="/boutique" className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-semibold">Boutique</Link>
        </div>
      </div>
    </div>
  );
}
