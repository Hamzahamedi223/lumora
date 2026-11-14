import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LOW_STOCK } from "@/lib/constants";

const COUNTED = Prisma.sql`status NOT IN ('CANCELLED', 'RETURNED')`;

/** Dashboard numbers. Revenue excludes cancelled / returned orders. Days are in Tunis time. */
export async function dashboardStats(days: number) {
  const since = new Date(Date.now() - days * 864e5);
  const prevSince = new Date(Date.now() - 2 * days * 864e5);

  const [cur, prev, daily, byStatus, top, lowStock, pendingOrders, newRequests, pendingReviews, unreadMessages, customers] = await Promise.all([
    db.$queryRaw<{ revenue: bigint | null; orders: bigint }[]>`
      SELECT SUM("totalMinor") AS revenue, COUNT(*) AS orders FROM orders WHERE "createdAt" >= ${since} AND ${COUNTED}`,
    db.$queryRaw<{ revenue: bigint | null; orders: bigint }[]>`
      SELECT SUM("totalMinor") AS revenue, COUNT(*) AS orders FROM orders WHERE "createdAt" >= ${prevSince} AND "createdAt" < ${since} AND ${COUNTED}`,
    db.$queryRaw<{ day: string; revenue: bigint; orders: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Tunis', 'YYYY-MM-DD') AS day,
             SUM("totalMinor") AS revenue, COUNT(*) AS orders
      FROM orders WHERE "createdAt" >= ${since} AND ${COUNTED}
      GROUP BY 1 ORDER BY 1`,
    db.order.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.$queryRaw<{ name: string; productId: string | null; qty: bigint; revenue: bigint }[]>`
      SELECT oi.name, oi."productId", SUM(oi.quantity) AS qty, SUM(oi."lineTotalMinor") AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi."orderId"
      WHERE o."createdAt" >= ${since} AND o.status NOT IN ('CANCELLED', 'RETURNED')
      GROUP BY oi.name, oi."productId" ORDER BY revenue DESC LIMIT 5`,
    db.variant.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK }, product: { status: "ACTIVE", madeToOrder: false } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, stock: true, product: { select: { id: true, name: true } } },
    }),
    db.order.count({ where: { status: "PENDING" } }),
    db.customRequest.count({ where: { status: "NEW" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { isRead: false } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since } } }),
  ]);

  // Fill missing days so the chart has one bar per day.
  const map = new Map(daily.map((d) => [d.day, d]));
  const series: { day: string; revenue: number; orders: number }[] = [];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" });
  for (let i = days - 1; i >= 0; i--) {
    const day = fmt.format(new Date(Date.now() - i * 864e5));
    const d = map.get(day);
    series.push({ day, revenue: Number(d?.revenue ?? 0), orders: Number(d?.orders ?? 0) });
  }

  const revenue = Number(cur[0]?.revenue ?? 0);
  const orders = Number(cur[0]?.orders ?? 0);
  const prevRevenue = Number(prev[0]?.revenue ?? 0);
  const prevOrders = Number(prev[0]?.orders ?? 0);
  const delta = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100));

  return {
    revenue,
    orders,
    aov: orders ? Math.round(revenue / orders) : 0,
    revenueDelta: delta(revenue, prevRevenue),
    ordersDelta: delta(orders, prevOrders),
    aovDelta: delta(orders ? revenue / orders : 0, prevOrders ? prevRevenue / prevOrders : 0),
    newCustomers: customers,
    series,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>,
    top: top.map((t) => ({ name: t.name, productId: t.productId, qty: Number(t.qty), revenue: Number(t.revenue) })),
    lowStock,
    todo: { pendingOrders, newRequests, pendingReviews, unreadMessages },
  };
}
