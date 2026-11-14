"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { IconUpload } from "@/components/icons";
import { customRequestAction } from "@/server/actions/public";

export function CustomRequestForm() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <ActionForm action={customRequestAction} resetOnSuccess>
      {(s) =>
        s.ok ? null : (
          <>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nom complet" error={s.fieldErrors?.name}>
                <Input name="name" defaultValue={s.values?.name} autoComplete="name" required />
              </Field>
              <Field label="Téléphone" error={s.fieldErrors?.phone}>
                <Input name="phone" type="tel" defaultValue={s.values?.phone} autoComplete="tel" required />
              </Field>
              <Field label="E-mail" error={s.fieldErrors?.email} className="sm:col-span-2">
                <Input name="email" type="email" defaultValue={s.values?.email} autoComplete="email" required />
              </Field>
              <Field label="Type de projet" error={s.fieldErrors?.type}>
                <Select name="type" defaultValue={s.values?.type ?? "LAMP"}>
                  <option value="LAMP">Luminaire</option>
                  <option value="WALL_ART">Art mural</option>
                  <option value="OTHER">Autre objet</option>
                </Select>
              </Field>
              <Field label="Dimensions souhaitées" error={s.fieldErrors?.dimensions}>
                <Input name="dimensions" defaultValue={s.values?.dimensions} placeholder="ex. Ø 60 cm" />
              </Field>
              <Field label="Couleurs" error={s.fieldErrors?.colors}>
                <Input name="colors" defaultValue={s.values?.colors} placeholder="ex. sable, terracotta" />
              </Field>
              <Field label="Budget indicatif" error={s.fieldErrors?.budget}>
                <Input name="budget" defaultValue={s.values?.budget} placeholder="ex. 300 – 500 DT" />
              </Field>
              <Field label="Échéance" error={s.fieldErrors?.deadline} className="sm:col-span-2">
                <Input name="deadline" defaultValue={s.values?.deadline} placeholder="ex. avant l'ouverture le 15 mars" />
              </Field>
              <Field label="Votre projet" error={s.fieldErrors?.description} className="sm:col-span-2">
                <Textarea name="description" rows={5} defaultValue={s.values?.description} required placeholder="Lieu, usage, ambiance recherchée, quantité…" />
              </Field>
            </div>
            <div>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted hover:border-accent/60">
                <IconUpload className="text-accent" />
                <span>Photos d&apos;inspiration, croquis, plans <span className="text-subtle">(5 fichiers max, 10 Mo chacun — JPG, PNG, WEBP, PDF, STL, OBJ, 3MF)</span></span>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.avif,.pdf,.stl,.obj,.3mf"
                  className="sr-only"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {files.length ? <ul className="mt-3 space-y-1 text-xs text-muted">{files.map((f) => <li key={f.name}>• {f.name} ({(f.size / 1024 / 1024).toFixed(1)} Mo)</li>)}</ul> : null}
              {s.fieldErrors?.files ? <p className="mt-2 text-xs text-danger">{s.fieldErrors.files}</p> : null}
            </div>
            <SubmitButton size="lg" className="w-full" pendingText="Envoi en cours…">Envoyer ma demande</SubmitButton>
            <p className="text-center text-xs text-subtle">Devis gratuit et sans engagement · réponse sous 48 h</p>
          </>
        )
      }
    </ActionForm>
  );
}
