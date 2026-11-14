import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, REQUEST_TYPE_LABEL } from "@/lib/constants";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mes demandes sur mesure", robots: { index: false } };

export default async function AccountRequests() {
  const user = await requireUser();
  const requests = await db.customRequest.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (!requests.length) return <EmptyState title="Aucune demande sur mesure" text="Vous avez un projet ? Décrivez-le, nous vous répondons sous 48 h." action={<ButtonLink href="/sur-mesure">Démarrer un projet</ButtonLink>} />;
  return (
    <div>
      <h2 className="mb-5 text-lg font-medium">Mes demandes sur mesure</h2>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{r.number} · {REQUEST_TYPE_LABEL[r.type]}</p>
              <Badge tone={REQUEST_STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
            <p className="mt-3 text-xs text-subtle">
              {formatDate(r.createdAt)}
              {r.quoteMinor != null ? <> · Devis : <span className="font-semibold text-fg">{formatPrice(r.quoteMinor)}</span></> : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
