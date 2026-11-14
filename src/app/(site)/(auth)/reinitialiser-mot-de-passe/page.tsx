import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../auth-shell";
import { ResetForm } from "../auth-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Nouveau mot de passe">
      {token ? <ResetForm token={token} /> : <p className="text-muted">Lien invalide. <Link href="/mot-de-passe-oublie" className="text-accent">Faire une nouvelle demande</Link>.</p>}
    </AuthShell>
  );
}
