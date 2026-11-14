"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Select } from "@/components/ui";
import { saveCouponAction } from "@/server/actions/admin";

export function CouponForm() {
  return (
    <ActionForm action={saveCouponAction} resetOnSuccess>
      {(s) => {
        const v = (k: string) => (s.ok ? "" : s.values?.[k]);
        const e = s.fieldErrors ?? {};
        return (
          <>
            <Field label="Code" error={e.code}><Input name="code" defaultValue={v("code")} className="uppercase" placeholder="ETE2026" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><Select name="type" defaultValue={v("type") || "PERCENT"}><option value="PERCENT">Pourcentage</option><option value="FIXED">Montant (DT)</option></Select></Field>
              <Field label="Valeur" error={e.value}><Input name="value" inputMode="decimal" defaultValue={v("value")} placeholder="10" required /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Achat minimum (DT)" error={e.minSubtotal}><Input name="minSubtotal" inputMode="decimal" defaultValue={v("minSubtotal")} /></Field>
              <Field label="Utilisations max" error={e.maxUses}><Input name="maxUses" inputMode="numeric" defaultValue={v("maxUses")} placeholder="illimité" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Début" error={e.startsAt}><Input name="startsAt" type="date" defaultValue={v("startsAt")} /></Field>
              <Field label="Fin" error={e.endsAt}><Input name="endsAt" type="date" defaultValue={v("endsAt")} /></Field>
            </div>
            <SubmitButton className="w-full" pendingText="…">Créer le code</SubmitButton>
          </>
        );
      }}
    </ActionForm>
  );
}
