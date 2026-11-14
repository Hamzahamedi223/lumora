import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  // Prefill the address from the customer's last order.
  const last = user
    ? await db.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { governorate: true, city: true, addressLine: true, postalCode: true, customerPhone: true },
      })
    : null;
  const p = settings.payments;
  const methods = [
    p.cod && { value: "CASH_ON_DELIVERY", label: "Paiement à la livraison", hint: "Payez en espèces à la réception de votre colis." },
    p.bankTransfer && { value: "BANK_TRANSFER", label: "Virement bancaire", hint: p.bankDetails || "Nos coordonnées bancaires vous seront communiquées après la commande." },
    p.d17 && { value: "D17", label: "D17", hint: p.d17Number ? `Envoyez le montant au ${p.d17Number} après la commande.` : "Les instructions vous seront communiquées après la commande." },
  ].filter(Boolean) as { value: string; label: string; hint: string }[];

  return (
    <CheckoutForm
      methods={methods}
      deliveryDays={settings.shipping.deliveryDays}
      defaults={{
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: last?.customerPhone ?? user?.phone ?? "",
        governorate: last?.governorate ?? "",
        city: last?.city ?? "",
        addressLine: last?.addressLine ?? "",
        postalCode: last?.postalCode ?? "",
      }}
      loggedIn={!!user}
    />
  );
}
