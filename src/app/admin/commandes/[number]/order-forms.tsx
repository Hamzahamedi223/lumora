"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { orderNoteAction, orderPaymentAction, orderStatusAction } from "@/server/actions/admin";

export function PrintButton() {
  return <Button variant="secondary" size="sm" onClick={() => window.print()}>Imprimer le bon de livraison</Button>;
}

export function OrderStatusForm({ orderId, transitions, trackingNumber }: { orderId: string; transitions: { value: string; label: string }[]; trackingNumber: string }) {
  const [to, setTo] = useState(transitions[0]?.value ?? "");
  return (
    <ActionForm action={orderStatusAction}>
      {() => (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <Field label="Nouveau statut">
            <Select name="to" value={to} onChange={(e) => setTo(e.target.value)}>
              {transitions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          {to === "SHIPPED" ? (
            <Field label="N° de suivi transporteur (facultatif)">
              <Input name="trackingNumber" defaultValue={trackingNumber} maxLength={80} />
            </Field>
          ) : null}
          {to === "RETURNED" ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="restock" defaultChecked className="accent-[#e8b062]" /> Remettre les articles en stock
            </label>
          ) : null}
          {to === "CANCELLED" ? <p className="text-xs text-muted">Les articles seront remis en stock automatiquement.</p> : null}
          <Field label="Commentaire (facultatif)">
            <Textarea name="note" rows={2} maxLength={300} />
          </Field>
          <p className="text-xs text-subtle">Le client est prévenu par e-mail (confirmée, expédiée, livrée, annulée).</p>
          <SubmitButton variant={to === "CANCELLED" ? "danger" : "primary"} className="w-full" pendingText="Mise à jour…">Appliquer</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function OrderPaymentForm({ orderId, current }: { orderId: string; current: string }) {
  return (
    <ActionForm action={orderPaymentAction} className="flex flex-wrap items-end gap-2 space-y-0">
      {() => (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <Select name="paymentStatus" defaultValue={current} className="h-9 w-auto flex-1 py-1.5">
            <option value="UNPAID">Non payée</option>
            <option value="PAID">Payée</option>
            <option value="REFUNDED">Remboursée</option>
          </Select>
          <SubmitButton size="sm" variant="secondary">Mettre à jour</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function OrderNoteForm({ orderId, note }: { orderId: string; note: string }) {
  return (
    <ActionForm action={orderNoteAction}>
      {() => (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <Textarea name="adminNote" defaultValue={note} rows={3} maxLength={2000} placeholder="Visible uniquement par l'équipe" />
          <SubmitButton size="sm" variant="secondary">Enregistrer</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
