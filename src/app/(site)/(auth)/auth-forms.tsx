"use client";

import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input } from "@/components/ui";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/server/actions/account";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={loginAction}>
      {(s) => (
        <>
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="E-mail">
            <Input name="email" type="email" autoComplete="email" defaultValue={s.values?.email} required />
          </Field>
          <Field label="Mot de passe">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <div className="text-right text-sm">
            <Link href="/mot-de-passe-oublie" className="text-muted hover:text-accent">Mot de passe oublié ?</Link>
          </div>
          <SubmitButton size="lg" className="w-full" pendingText="Connexion…">Se connecter</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  return (
    <ActionForm action={registerAction}>
      {(s) => (
        <>
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Nom complet" error={s.fieldErrors?.name}>
            <Input name="name" autoComplete="name" defaultValue={s.values?.name} required aria-invalid={!!s.fieldErrors?.name} />
          </Field>
          <Field label="E-mail" error={s.fieldErrors?.email}>
            <Input name="email" type="email" autoComplete="email" defaultValue={s.values?.email} required aria-invalid={!!s.fieldErrors?.email} />
          </Field>
          <Field label="Téléphone (facultatif)" error={s.fieldErrors?.phone}>
            <Input name="phone" type="tel" autoComplete="tel" defaultValue={s.values?.phone} aria-invalid={!!s.fieldErrors?.phone} />
          </Field>
          <Field label="Mot de passe" error={s.fieldErrors?.password} hint="8 caractères minimum">
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={!!s.fieldErrors?.password} />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingText="Création…">Créer mon compte</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function ForgotForm() {
  return (
    <ActionForm action={forgotPasswordAction}>
      {(s) =>
        s.ok ? null : (
          <>
            <Field label="E-mail">
              <Input name="email" type="email" autoComplete="email" defaultValue={s.values?.email} required />
            </Field>
            <SubmitButton size="lg" className="w-full" pendingText="Envoi…">Recevoir le lien</SubmitButton>
          </>
        )
      }
    </ActionForm>
  );
}

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPasswordAction}>
      {(s) => (
        <>
          <input type="hidden" name="token" value={token} />
          <Field label="Nouveau mot de passe" error={s.fieldErrors?.password} hint="8 caractères minimum">
            <Input name="password" type="password" autoComplete="new-password" required />
          </Field>
          <Field label="Confirmer" error={s.fieldErrors?.confirm}>
            <Input name="confirm" type="password" autoComplete="new-password" required />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingText="Enregistrement…">Enregistrer</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
