import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { deleteMessageAction, messageReadAction } from "@/server/actions/admin";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Button, EmptyState, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <AdminHeader title="Messages" subtitle="Messages reçus via le formulaire de contact." />
      {messages.length ? (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-surface p-5 ${m.isRead ? "border-border" : "border-accent/40"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{!m.isRead ? <span className="mr-2 inline-block size-2 rounded-full bg-accent" /> : null}{m.subject}</p>
                  <p className="text-sm text-muted">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                </div>
                <span className="text-xs text-subtle">{formatDate(m.createdAt, true)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className={buttonClass("primary", "sm")}>Répondre</a>
                <form action={messageReadAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="read" value={m.isRead ? "0" : "1"} /><Button size="sm" variant="secondary">{m.isRead ? "Marquer non lu" : "Marquer lu"}</Button></form>
                <form action={deleteMessageAction} className="ml-auto"><input type="hidden" name="id" value={m.id} /><Button size="sm" variant="ghost">Supprimer</Button></form>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Aucun message" />}
    </>
  );
}
