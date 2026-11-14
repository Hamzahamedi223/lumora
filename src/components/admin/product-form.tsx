"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { deleteProductAction, saveProductAction } from "@/server/actions/admin";
import { FormAlert, SubmitButton } from "@/components/form";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { IconTrash, IconUpload } from "@/components/icons";

type VariantRow = { key: string; id?: string; name: string; colorHex: string; sku: string; stock: number; originalStock?: number; isActive: boolean };
type ProductData = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  price: string;
  compareAt: string;
  featured: boolean;
  isNew: boolean;
  madeToOrder: boolean;
  leadTimeDays: string;
  material: string;
  dimensions: string;
  bulb: string;
  weight: string;
  images: { id: string; url: string; alt: string }[];
  variants: Omit<VariantRow, "key">[];
};

let k = 0;
const newKey = () => `v${++k}`;

export function ProductForm({ product, categories }: { product?: ProductData; categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveProductAction, {});
  const [images, setImages] = useState(product?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length ? product.variants.map((v) => ({ ...v, key: v.id ?? newKey() })) : [{ key: newKey(), name: "Standard", colorHex: "#efe4d2", sku: "", stock: 0, isActive: true }],
  );
  const [previews, setPreviews] = useState<string[]>([]);
  const [madeToOrder, setMadeToOrder] = useState(product?.madeToOrder ?? false);
  const [deleting, setDeleting] = useState(false);
  const [delState, delAction] = useActionState(deleteProductAction, {});
  const e = state.fieldErrors ?? {};
  const v = (key: keyof ProductData) => state.values?.[key] ?? (product ? String(product[key] ?? "") : "");

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };
  const setVariant = (key: string, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <>
      <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]" noValidate>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <input type="hidden" name="images" value={JSON.stringify(images.map(({ id, alt }) => ({ id, alt })))} />
        <input type="hidden" name="variants" value={JSON.stringify(variants.map((row) => ({ id: row.id, name: row.name, colorHex: row.colorHex, sku: row.sku, stock: row.stock, originalStock: row.originalStock, isActive: row.isActive })))} />

        <div className="space-y-6">
          <FormAlert state={state} />
          <section className="space-y-5 rounded-2xl border border-border bg-surface p-5">
            <Field label="Nom" error={e.name}><Input name="name" defaultValue={v("name")} required /></Field>
            <Field label="Accroche" error={e.tagline} hint="Courte phrase affichée sous le nom"><Input name="tagline" defaultValue={v("tagline")} maxLength={160} /></Field>
            <Field label="Description" error={e.description} hint="Séparez les paragraphes par une ligne vide"><Textarea name="description" rows={7} defaultValue={v("description")} /></Field>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold">Images</h2>
            {images.length ? (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, i) => (
                  <li key={img.id} className="rounded-xl border border-border p-2">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
                      <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" />
                      {i === 0 ? <span className="absolute top-1.5 left-1.5 rounded-full bg-accent px-2 text-[10px] font-bold text-accent-ink">Principale</span> : null}
                    </div>
                    <input value={img.alt} onChange={(ev) => setImages(images.map((x) => (x.id === img.id ? { ...x, alt: ev.target.value } : x)))} placeholder="Texte alternatif" className="mt-2 w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-xs" />
                    <div className="mt-2 flex justify-between text-xs">
                      <span className="flex gap-1">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 text-muted hover:text-fg disabled:opacity-30" aria-label="Avancer">←</button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded px-1.5 text-muted hover:text-fg disabled:opacity-30" aria-label="Reculer">→</button>
                      </span>
                      <button type="button" onClick={() => setImages(images.filter((x) => x.id !== img.id))} className="text-muted hover:text-danger" aria-label="Supprimer l'image"><IconTrash width={14} height={14} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted hover:border-accent/60">
              <IconUpload className="text-accent" />
              Ajouter des images (JPG, PNG, WEBP, AVIF · 8 Mo max) — format 4:5 recommandé
              <input
                type="file"
                name="newImages"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.avif"
                className="sr-only"
                onChange={(ev) => {
                  previews.forEach((p) => URL.revokeObjectURL(p));
                  setPreviews(Array.from(ev.target.files ?? []).map((f) => URL.createObjectURL(f)));
                }}
              />
            </label>
            {previews.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previews.map((p) => <img key={p} src={p} alt="" className="size-16 rounded-lg object-cover" />)}
                <p className="w-full text-xs text-subtle">Ces images seront ajoutées à l&apos;enregistrement.</p>
              </div>
            ) : null}
            {e.newImages ? <p className="mt-2 text-xs text-danger">{e.newImages}</p> : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Variantes & stock</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => setVariants([...variants, { key: newKey(), name: "", colorHex: "#cccccc", sku: "", stock: 0, isActive: true }])}>+ Variante</Button>
            </div>
            <div className="space-y-3">
              {variants.map((row) => (
                <div key={row.key} className="grid grid-cols-[auto_1fr_auto] items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[auto_1fr_1fr_110px_auto]">
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Couleur</span>
                    <input type="color" value={row.colorHex || "#cccccc"} onChange={(ev) => setVariant(row.key, { colorHex: ev.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Nom</span>
                    <input value={row.name} onChange={(ev) => setVariant(row.key, { name: ev.target.value })} placeholder="Ivoire" className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm" />
                  </label>
                  <label className="col-span-2 block sm:col-span-1">
                    <span className="mb-1 block text-[11px] text-subtle">SKU (facultatif)</span>
                    <input value={row.sku} onChange={(ev) => setVariant(row.key, { sku: ev.target.value })} className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Stock</span>
                    <input type="number" min={0} value={row.stock} disabled={madeToOrder} onChange={(ev) => setVariant(row.key, { stock: Math.max(0, Math.floor(Number(ev.target.value) || 0)) })} className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm tabular-nums disabled:opacity-40" />
                  </label>
                  <button type="button" onClick={() => setVariants(variants.filter((x) => x.key !== row.key))} disabled={variants.length === 1} className="grid size-10 place-items-center text-muted hover:text-danger disabled:opacity-30" aria-label="Supprimer la variante">
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>
            {madeToOrder ? <p className="mt-3 text-xs text-subtle">Produit fabriqué sur commande : le stock n&apos;est pas suivi.</p> : null}
            {e.variants ? <p className="mt-2 text-xs text-danger">{e.variants}</p> : null}
          </section>

          <section className="grid gap-5 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
            <h2 className="text-sm font-semibold sm:col-span-2">Caractéristiques</h2>
            <Field label="Matière" error={e.material}><Input name="material" defaultValue={v("material")} /></Field>
            <Field label="Dimensions" error={e.dimensions}><Input name="dimensions" defaultValue={v("dimensions")} /></Field>
            <Field label="Ampoule" error={e.bulb}><Input name="bulb" defaultValue={v("bulb")} /></Field>
            <Field label="Poids" error={e.weight}><Input name="weight" defaultValue={v("weight")} /></Field>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="space-y-5 rounded-2xl border border-border bg-surface p-5">
            <Field label="Statut">
              <Select name="status" defaultValue={v("status") || "DRAFT"}>
                <option value="ACTIVE">En ligne</option>
                <option value="DRAFT">Brouillon</option>
                <option value="ARCHIVED">Archivé</option>
              </Select>
            </Field>
            <Field label="Catégorie">
              <Select name="categoryId" defaultValue={v("categoryId")}>
                <option value="">Aucune</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix (DT)" error={e.price}><Input name="price" inputMode="decimal" defaultValue={v("price")} placeholder="129" /></Field>
              <Field label="Prix barré" error={e.compareAt}><Input name="compareAt" inputMode="decimal" defaultValue={v("compareAt")} placeholder="149" /></Field>
            </div>
            <div className="space-y-2.5 text-sm">
              <label className="flex items-center gap-2.5"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="accent-[#e8b062]" /> Mettre en avant (accueil)</label>
              <label className="flex items-center gap-2.5"><input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="accent-[#e8b062]" /> Badge « Nouveau »</label>
              <label className="flex items-center gap-2.5"><input type="checkbox" name="madeToOrder" checked={madeToOrder} onChange={(ev) => setMadeToOrder(ev.target.checked)} className="accent-[#e8b062]" /> Fabriqué sur commande</label>
            </div>
            {madeToOrder ? <Field label="Délai de fabrication (jours)" error={e.leadTimeDays}><Input name="leadTimeDays" inputMode="numeric" defaultValue={v("leadTimeDays")} /></Field> : null}
            <Field label="Slug (URL)" error={e.slug} hint="Laisser vide pour le générer depuis le nom"><Input name="slug" defaultValue={v("slug")} /></Field>
            <SubmitButton className="w-full" pendingText="Enregistrement…">{product ? "Enregistrer" : "Créer le produit"}</SubmitButton>
          </section>
        </aside>
      </form>

      {product ? (
        <div className="mt-10 max-w-xl rounded-2xl border border-danger/30 p-5">
          <p className="text-sm font-semibold">Supprimer ce produit</p>
          <p className="mt-1 text-xs text-muted">S&apos;il a déjà été commandé, il sera archivé (masqué) pour conserver l&apos;historique des commandes.</p>
          <FormAlert state={delState} />
          {deleting ? (
            <form action={delAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={product.id} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(false)}>Annuler</Button>
              <SubmitButton variant="danger" size="sm" pendingText="Suppression…">Confirmer la suppression</SubmitButton>
            </form>
          ) : (
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleting(true)}>Supprimer</Button>
          )}
        </div>
      ) : null}
    </>
  );
}
