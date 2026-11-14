"use client";

import { useState } from "react";
import { reviewAction } from "@/server/actions/public";
import { ActionForm, SubmitButton } from "@/components/form";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function ReviewForm({ productId, defaultName }: { productId: string; defaultName?: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  if (!open)
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Donner mon avis
      </Button>
    );
  return (
    <ActionForm action={reviewAction} className="max-w-xl rounded-2xl border border-border bg-surface p-6" resetOnSuccess>
      {(s) =>
        s.ok ? null : (
          <>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="rating" value={rating || ""} />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Votre note</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Note">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} étoile${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} className="text-accent transition hover:scale-110">
                    <svg width="28" height="28" viewBox="0 0 20 20" fill={i <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
                      <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8l-4.3-4 5.8-.7z" />
                    </svg>
                  </button>
                ))}
              </div>
              {s.fieldErrors?.rating ? <p className="mt-1 text-xs text-danger">{s.fieldErrors.rating}</p> : null}
            </div>
            <Field label="Votre prénom" error={s.fieldErrors?.name}>
              <Input name="name" defaultValue={s.values?.name ?? defaultName} maxLength={80} required />
            </Field>
            <Field label="Votre avis" error={s.fieldErrors?.body}>
              <Textarea name="body" defaultValue={s.values?.body} maxLength={2000} required placeholder="Qualité, rendu de la lumière, livraison…" />
            </Field>
            <SubmitButton pendingText="Envoi…">Publier mon avis</SubmitButton>
          </>
        )
      }
    </ActionForm>
  );
}
