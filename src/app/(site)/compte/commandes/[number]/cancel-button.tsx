"use client";

import { useActionState, useState } from "react";
import { cancelOrderAction } from "@/server/actions/account";
import { FormAlert, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui";

export function CancelOrderButton({ number }: { number: string }) {
  const [state, action] = useActionState(cancelOrderAction, {});
  const [confirming, setConfirming] = useState(false);
  if (state.ok) return <FormAlert state={state} />;
  return (
    <div className="space-y-3">
      <FormAlert state={state} />
      {confirming ? (
        <form action={action} className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <input type="hidden" name="number" value={number} />
          <p className="flex-1 text-sm">Annuler définitivement cette commande ?</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>Non</Button>
          <SubmitButton variant="danger" size="sm" pendingText="Annulation…">Oui, annuler</SubmitButton>
        </form>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>Annuler la commande</Button>
      )}
    </div>
  );
}
