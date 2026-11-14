import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "../auth-shell";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/compte");
  return (
    <AuthShell
      title="Créer un compte"
      intro="Suivez vos commandes, retrouvez vos adresses et vos demandes sur mesure."
      footer={<>Déjà client ? <Link href="/connexion" className="text-accent hover:underline">Se connecter</Link></>}
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
