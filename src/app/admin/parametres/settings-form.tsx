"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Textarea } from "@/components/ui";
import { saveSettingsAction } from "@/server/actions/admin";
import type { StoreSettings } from "@/lib/settings";

const money = (m: number) => String(m / 1000);

export function SettingsForm({ s }: { s: StoreSettings }) {
  return (
    <ActionForm action={saveSettingsAction} className="max-w-4xl">
      {(st) => {
        const e = st.fieldErrors ?? {};
        return (
          <>
            <section className="grid gap-5 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Boutique</h2>
              <Field label="Nom"><Input name="name" defaultValue={s.store.name} /></Field>
              <Field label="E-mail de contact" error={e.email}><Input name="email" type="email" defaultValue={s.store.email} /></Field>
              <Field label="Téléphone"><Input name="phone" defaultValue={s.store.phone} /></Field>
              <Field label="WhatsApp" hint="Format international sans + (ex. 21620000000)"><Input name="whatsapp" defaultValue={s.store.whatsapp} /></Field>
              <Field label="Adresse" className="sm:col-span-2"><Input name="address" defaultValue={s.store.address} /></Field>
              <Field label="Accroche (pied de page)" className="sm:col-span-2"><Input name="tagline" defaultValue={s.store.tagline} /></Field>
              <Field label="Instagram" error={e.instagram}><Input name="instagram" defaultValue={s.store.instagram} placeholder="https://instagram.com/…" /></Field>
              <Field label="Facebook" error={e.facebook}><Input name="facebook" defaultValue={s.store.facebook} placeholder="https://facebook.com/…" /></Field>
            </section>

            <section className="grid gap-5 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
              <h2 className="text-sm font-semibold sm:col-span-2">Page d&apos;accueil</h2>
              <Field label="Bandeau d'annonce" hint="Laisser vide pour masquer" className="sm:col-span-2"><Input name="announcement" defaultValue={s.store.announcement} maxLength={160} /></Field>
              <Field label="Titre principal" hint="Le texte après la virgule s'affiche en doré" className="sm:col-span-2"><Input name="heroTitle" defaultValue={s.store.heroTitle} maxLength={120} /></Field>
              <Field label="Sous-titre" className="sm:col-span-2"><Textarea name="heroSubtitle" rows={3} defaultValue={s.store.heroSubtitle} maxLength={400} /></Field>
            </section>

            <section className="grid gap-5 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-3">
              <h2 className="text-sm font-semibold sm:col-span-3">Livraison</h2>
              <Field label="Frais de livraison (DT)" error={e.feeMinor}><Input name="feeMinor" inputMode="decimal" defaultValue={money(s.shipping.feeMinor)} /></Field>
              <Field label="Offerte dès (DT)" error={e.freeThresholdMinor} hint="0 = jamais offerte"><Input name="freeThresholdMinor" inputMode="decimal" defaultValue={money(s.shipping.freeThresholdMinor)} /></Field>
              <Field label="Délai affiché"><Input name="deliveryDays" defaultValue={s.shipping.deliveryDays} /></Field>
            </section>

            <section className="space-y-5 rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold">Paiements</h2>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="cod" defaultChecked={s.payments.cod} className="accent-[#e8b062]" /> Paiement à la livraison</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="bankTransfer" defaultChecked={s.payments.bankTransfer} className="accent-[#e8b062]" /> Virement bancaire</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="d17" defaultChecked={s.payments.d17} className="accent-[#e8b062]" /> D17</label>
              </div>
              {e.payments ? <p className="text-xs text-danger">{e.payments}</p> : null}
              <Field label="Coordonnées bancaires (affichées après une commande par virement)"><Textarea name="bankDetails" rows={3} defaultValue={s.payments.bankDetails} placeholder={"Titulaire : …\nBanque : …\nRIB : …"} /></Field>
              <Field label="Numéro D17"><Input name="d17Number" defaultValue={s.payments.d17Number} /></Field>
            </section>

            <SubmitButton size="lg" pendingText="Enregistrement…">Enregistrer les paramètres</SubmitButton>
          </>
        );
      }}
    </ActionForm>
  );
}
