"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";
import { updateRequestAction } from "@/server/actions/admin";

export function RequestForm({ id, status, quote, note }: { id: string; status: string; quote: string; note: string }) {
  return (
    <ActionForm action={updateRequestAction}>
      {(s) => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field label="Statut">
            <Select name="status" defaultValue={status}>
              {Object.entries(REQUEST_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Montant du devis (DT)" error={s.fieldErrors?.quote}>
            <Input name="quote" inputMode="decimal" defaultValue={quote} placeholder="450" />
          </Field>
          <Field label="Notes internes">
            <Textarea name="adminNote" rows={4} defaultValue={note} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="notify" defaultChecked className="accent-[#e8b062]" /> Prévenir le client par e-mail si le statut change
          </label>
          <SubmitButton className="w-full" pendingText="…">Enregistrer</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
