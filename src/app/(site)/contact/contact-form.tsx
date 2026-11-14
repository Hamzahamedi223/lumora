"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Textarea } from "@/components/ui";
import { contactAction } from "@/server/actions/public";

export function ContactForm() {
  return (
    <ActionForm action={contactAction} resetOnSuccess>
      {(s) => (
        <>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom" error={s.fieldErrors?.name}>
              <Input name="name" defaultValue={s.ok ? "" : s.values?.name} autoComplete="name" required />
            </Field>
            <Field label="E-mail" error={s.fieldErrors?.email}>
              <Input name="email" type="email" defaultValue={s.ok ? "" : s.values?.email} autoComplete="email" required />
            </Field>
            <Field label="Téléphone (facultatif)" error={s.fieldErrors?.phone}>
              <Input name="phone" type="tel" defaultValue={s.ok ? "" : s.values?.phone} autoComplete="tel" />
            </Field>
            <Field label="Sujet" error={s.fieldErrors?.subject}>
              <Input name="subject" defaultValue={s.ok ? "" : s.values?.subject} required />
            </Field>
            <Field label="Message" error={s.fieldErrors?.message} className="sm:col-span-2">
              <Textarea name="message" rows={6} defaultValue={s.ok ? "" : s.values?.message} required />
            </Field>
          </div>
          <SubmitButton size="lg" pendingText="Envoi…">Envoyer le message</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
