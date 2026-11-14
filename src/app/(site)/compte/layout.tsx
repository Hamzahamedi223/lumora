import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/server/actions/account";
import { Container } from "@/components/ui";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [
    { href: "/compte", label: "Mes commandes" },
    { href: "/compte/demandes", label: "Mes demandes sur mesure" },
    { href: "/compte/profil", label: "Profil & sécurité" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Tableau de bord admin" }] : []),
  ];
  return (
    <Container className="py-10 sm:py-14">
      <p className="text-sm text-muted">Bonjour,</p>
      <h1 className="font-display text-4xl font-light tracking-tight">{user.name}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Espace client">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-4 py-2.5 text-sm whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg">{l.label}</Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded-xl px-4 py-2.5 text-left text-sm whitespace-nowrap text-subtle hover:bg-surface-2 hover:text-danger">Se déconnecter</button>
          </form>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
