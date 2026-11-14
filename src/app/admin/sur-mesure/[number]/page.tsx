import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_TONE, REQUEST_TYPE_LABEL } from "@/lib/constants";
import { AdminHeader, Panel } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui";
import { RequestForm } from "./request-form";

export default async function RequestDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const r = await db.customRequest.findUnique({ where: { number }, include: { files: true } });
  if (!r) notFound();
  const facts = [
    ["Type", REQUEST_TYPE_LABEL[r.type]],
    ["Dimensions", r.dimensions],
    ["Couleurs", r.colors],
    ["Budget", r.budget],
    ["Échéance", r.deadline],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <>
      <AdminHeader back={{ href: "/admin/sur-mesure", label: "Sur mesure" }} title={<span className="flex items-center gap-3">{r.number} <Badge tone={REQUEST_STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge></span>} subtitle={`Reçue le ${formatDate(r.createdAt, true)}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Projet">
            <p className="text-sm leading-relaxed whitespace-pre-line">{r.description}</p>
            <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
              {facts.map(([k, v]) => <div key={k}><dt className="text-xs text-subtle">{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </Panel>
          <Panel title={`Fichiers (${r.files.length})`}>
            {r.files.length ? (
              <ul className="space-y-2 text-sm">
                {r.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="truncate">{f.name} <span className="text-xs text-subtle">({(f.size / 1024 / 1024).toFixed(1)} Mo)</span></span>
                    <a href={`/api/files/${f.id}`} className="shrink-0 text-accent hover:underline">Télécharger</a>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucun fichier joint.</p>}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Client">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{r.name}</p>
              <p><a href={`tel:${r.phone}`} className="text-accent">{r.phone}</a></p>
              <p><a href={`mailto:${r.email}`} className="text-muted hover:text-fg">{r.email}</a></p>
              <p className="pt-2"><a href={`https://wa.me/216${r.phone.replace(/\D/g, "").slice(-8)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">Écrire sur WhatsApp ↗</a></p>
            </div>
          </Panel>
          <Panel title="Suivi">
            <RequestForm id={r.id} status={r.status} quote={r.quoteMinor != null ? String(r.quoteMinor / 1000) : ""} note={r.adminNote ?? ""} />
          </Panel>
        </div>
      </div>
    </>
  );
}
