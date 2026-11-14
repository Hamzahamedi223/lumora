import type { OrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/components/ui";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Commande reçue" },
  { status: "CONFIRMED", label: "Confirmée" },
  { status: "SHIPPED", label: "Expédiée" },
  { status: "DELIVERED", label: "Livrée" },
];

export function OrderTimeline({ status, events }: { status: OrderStatus; events: { status: OrderStatus | null; createdAt: string }[] }) {
  if (status === "CANCELLED" || status === "RETURNED")
    return <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">{status === "CANCELLED" ? "Cette commande a été annulée." : "Cette commande a été retournée."}</p>;
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const at = events.findLast((e) => e.status === s.status)?.createdAt;
        return (
          <li key={s.status} className="relative">
            <div className={cn("h-1 rounded-full", done ? "bg-accent" : "bg-surface-3")} />
            <p className={cn("mt-3 text-xs font-medium sm:text-sm", done ? "text-fg" : "text-subtle")}>{s.label}</p>
            {done && at ? <p className="mt-0.5 hidden text-xs text-subtle sm:block">{formatDate(at)}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
