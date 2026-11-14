"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input } from "@/components/ui";
import { trackOrderAction } from "@/server/actions/public";

export function TrackForm({ defaultNumber }: { defaultNumber?: string }) {
  return (
    <ActionForm action={trackOrderAction}>
      {(s) => (
        <>
          <Field label="Numéro de commande">
            <Input name="number" defaultValue={s.values?.number ?? defaultNumber} placeholder="LUM-251113-XXXXX" required className="uppercase" />
          </Field>
          <Field label="E-mail ou téléphone">
            <Input name="contact" defaultValue={s.values?.contact} required />
          </Field>
          <SubmitButton size="lg" className="w-full" pendingText="Recherche…">Suivre ma commande</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
