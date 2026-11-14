"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrderAction } from "@/server/actions/public";
import { toLines, useCart } from "@/components/shop/cart-store";
import { usePricedCart } from "@/components/shop/use-priced-cart";
import { CouponBox, SummaryItems, Totals } from "@/components/shop/order-summary";
import { FormAlert, SubmitButton } from "@/components/form";
import { ButtonLink, cn, Container, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { GOVERNORATES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

type Defaults = Record<"name" | "email" | "phone" | "governorate" | "city" | "addressLine" | "postalCode", string>;

export function CheckoutForm({
  methods,
  defaults,
  deliveryDays,
  loggedIn,
}: {
  methods: { value: string; label: string; hint: string }[];
  defaults: Defaults;
  deliveryDays: string;
  loggedIn: boolean;
}) {
  const state = useCart();
  const [res, action] = useActionState(placeOrderAction, {});
  const { data, loading } = usePricedCart(state.items, state.coupon);
  const v = (k: keyof Defaults) => res.values?.[k] ?? defaults[k];
  const e = res.fieldErrors ?? {};

  if (state.items.length === 0)
    return (
      <Container className="py-16">
        <EmptyState title="Votre panier est vide" text="Ajoutez des pièces à votre panier pour passer commande." action={<ButtonLink href="/boutique">Découvrir la collection</ButtonLink>} />
      </Container>
    );

  const blocked = !data || loading || data.items.length === 0 || data.issues.length > 0 || (!!state.coupon && !!data.couponError);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Finaliser la commande</h1>
      {!loggedIn ? (
        <p className="mt-3 text-sm text-muted">
          Déjà client ? <Link href="/connexion?next=/commande" className="text-accent hover:underline">Connectez-vous</Link> pour suivre vos commandes. Sinon, continuez en invité.
        </p>
      ) : null}

      <form action={action} className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]" noValidate>
        <input type="hidden" name="cart" value={JSON.stringify(toLines(state.items))} />
        <input type="hidden" name="coupon" value={state.coupon} />
        <div className="space-y-10">
          <FormAlert state={res} />
          <section>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-medium"><span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">1</span>Vos coordonnées</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nom complet" error={e.name} className="sm:col-span-2">
                <Input name="name" defaultValue={v("name")} autoComplete="name" required aria-invalid={!!e.name} />
              </Field>
              <Field label="E-mail" error={e.email} hint="Pour la confirmation de commande">
                <Input name="email" type="email" defaultValue={v("email")} autoComplete="email" required aria-invalid={!!e.email} />
              </Field>
              <Field label="Téléphone" error={e.phone} hint="Le livreur vous appellera">
                <Input name="phone" type="tel" defaultValue={v("phone")} autoComplete="tel" placeholder="20 123 456" required aria-invalid={!!e.phone} />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-medium"><span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">2</span>Livraison</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Gouvernorat" error={e.governorate}>
                <Select name="governorate" defaultValue={v("governorate")} required aria-invalid={!!e.governorate}>
                  <option value="">Choisir…</option>
                  {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </Field>
              <Field label="Ville / délégation" error={e.city}>
                <Input name="city" defaultValue={v("city")} autoComplete="address-level2" required aria-invalid={!!e.city} />
              </Field>
              <Field label="Adresse" error={e.addressLine} className="sm:col-span-2">
                <Input name="addressLine" defaultValue={v("addressLine")} autoComplete="street-address" placeholder="Rue, numéro, immeuble, étage…" required aria-invalid={!!e.addressLine} />
              </Field>
              <Field label="Code postal (facultatif)" error={e.postalCode}>
                <Input name="postalCode" defaultValue={v("postalCode")} inputMode="numeric" maxLength={4} autoComplete="postal-code" aria-invalid={!!e.postalCode} />
              </Field>
              <div className="flex items-end pb-3 text-sm text-muted">Livraison en {deliveryDays}</div>
              <Field label="Instructions (facultatif)" error={e.notes} className="sm:col-span-2">
                <Textarea name="notes" rows={2} defaultValue={res.values?.notes} maxLength={500} placeholder="Horaires, point de repère, message cadeau…" />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-medium"><span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">3</span>Paiement</h2>
            {methods.length === 0 ? (
              <p className="text-sm text-danger">Aucun mode de paiement n&apos;est disponible pour le moment. Contactez-nous.</p>
            ) : (
              <div className="space-y-3" role="radiogroup">
                {methods.map((m) => (
                  <label key={m.value} className={cn("flex cursor-pointer gap-4 rounded-2xl border border-border p-4 transition hover:border-border-strong has-checked:border-accent has-checked:bg-accent/5")}>
                    <input type="radio" name="paymentMethod" value={m.value} defaultChecked={(res.values?.paymentMethod || methods[0].value) === m.value} className="mt-1 accent-[#e8b062]" />
                    <span>
                      <span className="block font-medium">{m.label}</span>
                      <span className="mt-0.5 block text-sm whitespace-pre-line text-muted">{m.hint}</span>
                    </span>
                  </label>
                ))}
                {e.paymentMethod ? <p className="text-xs text-danger">{e.paymentMethod}</p> : null}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-medium">Récapitulatif</h2>
          {data?.issues.length ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
              {data.issues.map((m) => <p key={m}>{m}</p>)}
              <Link href="/panier" className="mt-1 inline-block underline">Vérifier le panier</Link>
            </div>
          ) : null}
          <SummaryItems data={data} />
          <CouponBox coupon={state.coupon} data={data} />
          <Totals data={data} loading={loading} />
          <label className="flex gap-3 text-xs text-muted">
            <input type="checkbox" name="terms" className="mt-0.5 accent-[#e8b062]" required />
            <span>J&apos;accepte les <Link href="/legal/cgv" target="_blank" className="text-accent hover:underline">conditions générales de vente</Link>.</span>
          </label>
          {e.terms ? <p className="-mt-3 text-xs text-danger">{e.terms}</p> : null}
          <SubmitButton size="lg" className="w-full" pendingText="Validation…" disabled={blocked || methods.length === 0}>
            Confirmer la commande{data ? ` · ${formatPrice(data.totalMinor)}` : ""}
          </SubmitButton>
          <p className="text-center text-xs text-subtle">Vos données sont utilisées uniquement pour traiter votre commande.</p>
        </aside>
      </form>
    </Container>
  );
}
