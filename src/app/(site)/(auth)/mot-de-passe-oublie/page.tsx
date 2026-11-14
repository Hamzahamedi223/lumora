import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../auth-shell";
import { ForgotForm } from "../auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié" intro="Indiquez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe." footer={<Link href="/connexion" className="text-accent hover:underline">← Retour à la connexion</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
