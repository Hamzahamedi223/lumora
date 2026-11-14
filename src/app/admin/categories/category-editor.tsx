"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/server/actions/admin";
import { FormAlert, SubmitButton } from "@/components/form";
import { Button, Field, Input } from "@/components/ui";

type Cat = { id: string; name: string; slug: string; description: string; sortOrder: number; isActive: boolean; image: string | null; count: number };

export function CategoryEditor({ category }: { category?: Cat }) {
  const [state, action] = useActionState(saveCategoryAction, {});
  const [delState, delAction] = useActionState(deleteCategoryAction, {});
  const [confirm, setConfirm] = useState(false);
  const e = state.fieldErrors ?? {};
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <form action={action} className="space-y-4" key={category ? undefined : state.nonce}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{category ? `${category.name} · ${category.count} produit(s)` : "Nouvelle catégorie"}</p>
          {category?.image ? <span className="relative size-10 overflow-hidden rounded-lg"><Image src={category.image} alt="" fill sizes="40px" className="object-cover" /></span> : null}
        </div>
        <FormAlert state={state} />
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" error={e.name}><Input name="name" defaultValue={state.values?.name ?? category?.name} required /></Field>
          <Field label="Slug" error={e.slug}><Input name="slug" defaultValue={state.values?.slug ?? category?.slug} placeholder="auto" /></Field>
          <Field label="Description" className="sm:col-span-2"><Input name="description" defaultValue={state.values?.description ?? category?.description} /></Field>
          <Field label="Ordre"><Input name="sortOrder" type="number" defaultValue={state.values?.sortOrder ?? category?.sortOrder ?? 0} /></Field>
          <Field label="Image" error={e.image}><input type="file" name="image" accept=".jpg,.jpeg,.png,.webp,.avif" className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-fg" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="accent-[#e8b062]" /> Visible sur le site</label>
        <div className="flex items-center gap-2">
          <SubmitButton size="sm" pendingText="…">{category ? "Enregistrer" : "Créer"}</SubmitButton>
        </div>
      </form>
      {category ? (
        <div className="mt-3 border-t border-border pt-3">
          <FormAlert state={delState} />
          {confirm ? (
            <form action={delAction} className="flex items-center gap-2 text-xs">
              <input type="hidden" name="id" value={category.id} />
              <span className="text-muted">Les produits resteront, sans catégorie.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(false)}>Annuler</Button>
              <SubmitButton variant="danger" size="sm">Supprimer</SubmitButton>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="text-xs text-subtle hover:text-danger">Supprimer la catégorie</button>
          )}
        </div>
      ) : null}
    </div>
  );
}
