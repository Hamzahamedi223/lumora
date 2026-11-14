"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/server/actions/public";
import { SubmitButton } from "@/components/form";

export function NewsletterForm() {
  const [state, action] = useActionState(subscribeAction, {});
  if (state.ok) return <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" role="status">{state.message}</p>;
  return (
    <form action={action} className="w-full">
      <div className="flex gap-2 rounded-full border border-border-strong bg-surface p-1.5 focus-within:border-accent/60">
        <label htmlFor="newsletter-email" className="sr-only">Adresse e-mail</label>
        <input id="newsletter-email" name="email" type="email" required placeholder="Votre adresse e-mail" autoComplete="email" className="min-w-0 flex-1 bg-transparent px-4 text-sm placeholder:text-subtle focus:outline-none" />
        <SubmitButton size="sm">S&apos;inscrire</SubmitButton>
      </div>
      {state.error ? <p className="mt-2 px-4 text-xs text-danger" role="alert">{state.error}</p> : null}
    </form>
  );
}
