import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/server/actions/account";
import { Logo } from "@/components/layout/logo";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Tableau de bord", template: "%s · Admin Lumora" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [orders, requests, reviews, messages] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.customRequest.count({ where: { status: "NEW" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="no-print sticky top-0 z-30 border-b border-border bg-surface lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 lg:py-6">
            <Link href="/admin"><Logo /></Link>
            <Link href="/" className="text-xs text-muted hover:text-accent lg:hidden">Voir le site ↗</Link>
          </div>
          <AdminNav counts={{ orders, requests, reviews, messages }} />
          <div className="mt-auto hidden border-t border-border p-4 lg:block">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-subtle">{user.email}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <Link href="/" className="text-muted hover:text-accent">Voir le site ↗</Link>
              <form action={logoutAction}>
                <button type="submit" className="text-muted hover:text-danger">Déconnexion</button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
