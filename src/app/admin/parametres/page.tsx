import type { Metadata } from "next";
import { readSettingsUncached } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const s = await readSettingsUncached();
  return (
    <>
      <AdminHeader title="Paramètres" subtitle="Boutique, livraison, paiements et textes de la page d'accueil." />
      <SettingsForm s={s} />
    </>
  );
}
