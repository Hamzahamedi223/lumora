"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "@/server/actions/account";

export function ProfileForms({ name, phone, email }: { name: string; phone: string; email: string }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-lg font-medium">Informations</h2>
        <ActionForm action={updateProfileAction}>
          {(s) => (
            <>
              <Field label="E-mail" hint="Contactez-nous pour modifier votre e-mail.">
                <Input value={email} disabled readOnly />
              </Field>
              <Field label="Nom complet" error={s.fieldErrors?.name}>
                <Input name="name" defaultValue={s.values?.name ?? name} required />
              </Field>
              <Field label="Téléphone" error={s.fieldErrors?.phone}>
                <Input name="phone" type="tel" defaultValue={s.values?.phone ?? phone} />
              </Field>
              <SubmitButton pendingText="Enregistrement…">Enregistrer</SubmitButton>
            </>
          )}
        </ActionForm>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-lg font-medium">Mot de passe</h2>
        <ActionForm action={changePasswordAction} resetOnSuccess>
          {(s) => (
            <>
              <Field label="Mot de passe actuel" error={s.fieldErrors?.current}>
                <Input name="current" type="password" autoComplete="current-password" required />
              </Field>
              <Field label="Nouveau mot de passe" error={s.fieldErrors?.password}>
                <Input name="password" type="password" autoComplete="new-password" required />
              </Field>
              <Field label="Confirmer" error={s.fieldErrors?.confirm}>
                <Input name="confirm" type="password" autoComplete="new-password" required />
              </Field>
              <SubmitButton pendingText="Modification…">Modifier le mot de passe</SubmitButton>
            </>
          )}
        </ActionForm>
      </section>
    </div>
  );
}
