import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { deleteCouponAction, toggleCouponAction } from "@/server/actions/admin";
import { AdminHeader, Panel, Table, td } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui";
import { CouponForm } from "./coupon-form";

export const metadata: Metadata = { title: "Codes promo" };

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <>
      <AdminHeader title="Codes promo" subtitle="Les clients saisissent le code dans le panier ou à la commande." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Table head={["Code", "Remise", "Minimum", "Utilisations", "Validité", "Statut", ""]} empty={!coupons.length}>
          {coupons.map((c) => {
            const expired = c.endsAt && c.endsAt < now;
            const exhausted = c.maxUses != null && c.usedCount >= c.maxUses;
            return (
              <tr key={c.id}>
                <td className={`${td} font-mono font-semibold`}>{c.code}</td>
                <td className={td}>{c.type === "PERCENT" ? `${c.value} %` : formatPrice(c.value)}</td>
                <td className={`${td} text-muted`}>{c.minSubtotalMinor ? formatPrice(c.minSubtotalMinor) : "—"}</td>
                <td className={`${td} tabular-nums`}>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</td>
                <td className={`${td} text-xs text-muted`}>{c.startsAt ? formatDate(c.startsAt) : "—"} → {c.endsAt ? formatDate(c.endsAt) : "∞"}</td>
                <td className={td}><Badge tone={!c.isActive || expired || exhausted ? "zinc" : "green"}>{!c.isActive ? "Désactivé" : expired ? "Expiré" : exhausted ? "Épuisé" : "Actif"}</Badge></td>
                <td className={`${td} whitespace-nowrap text-right text-xs`}>
                  <form action={toggleCouponAction} className="inline"><input type="hidden" name="id" value={c.id} /><button className="text-muted hover:text-fg">{c.isActive ? "Désactiver" : "Activer"}</button></form>
                  {c.usedCount === 0 ? <form action={deleteCouponAction} className="ml-3 inline"><input type="hidden" name="id" value={c.id} /><button className="text-muted hover:text-danger">Supprimer</button></form> : null}
                </td>
              </tr>
            );
          })}
        </Table>
        <Panel title="Nouveau code">
          <CouponForm />
        </Panel>
      </div>
    </>
  );
}
