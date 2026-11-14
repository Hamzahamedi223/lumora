import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next, user.role === "ADMIN" ? "/admin" : "/compte"));
  return (
    <AuthShell
      title="Bon retour parmi nous"
      intro="Connectez-vous pour suivre vos commandes et vos projets sur mesure."
      footer={<>Pas encore de compte ? <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent hover:underline">Créer un compte</Link></>}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
