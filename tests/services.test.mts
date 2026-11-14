/**
 * End-to-end tests of the order service against the real database.
 * Run: npm test   (needs `npm run dev:db` running and a seeded database)
 * Creates its own test product / coupon and cleans up afterwards.
 */
import assert from "node:assert/strict";
import { db } from "../src/lib/db";

// next/cache is not available outside Next: stub the cache wrapper used by settings.
import Module from "node:module";
const req = Module.createRequire(import.meta.url);
const nextCache = req("next/cache");
nextCache.unstable_cache = (fn: unknown) => fn;

const { priceCart, createOrder, changeOrderStatus, AppError, normalizeLines, couponDiscount } = await import("../src/server/services/orders");

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n`, e);
    process.exitCode = 1;
  }
}

const TAG = `test-${Date.now()}`;
const customer = { name: "Test Client", email: `${TAG}@example.com`, phone: "20123456" };
const address = { governorate: "Tunis", city: "Tunis", addressLine: "1 rue du Test" };

const product = await db.product.create({
  data: {
    slug: TAG,
    name: "Produit test",
    description: "Produit créé par les tests",
    priceMinor: 100000,
    status: "ACTIVE",
    variants: { create: [{ name: "A", stock: 3 }, { name: "B", stock: 0 }] },
  },
  include: { variants: { orderBy: { name: "asc" } } },
});
const [vA, vB] = product.variants;
await db.coupon.create({ data: { code: `T${Date.now()}`.slice(0, 20), type: "PERCENT", value: 10, maxUses: 1 } });
const coupon = await db.coupon.findFirstOrThrow({ where: { code: { startsWith: "T" }, maxUses: 1 }, orderBy: { createdAt: "desc" } });

console.log("Order service");

await test("normalizeLines rejects junk and merges duplicates", async () => {
  const l = normalizeLines([{ variantId: vA.id, quantity: 2 }, { variantId: vA.id, quantity: 1 }, { variantId: "x", quantity: 1 }, { variantId: vA.id, quantity: -4 }, null, "bad"]);
  assert.deepEqual(l, [{ variantId: vA.id, quantity: 3 }]);
});

await test("couponDiscount never exceeds subtotal", async () => {
  assert.equal(couponDiscount({ type: "PERCENT", value: 10 }, 100000), 10000);
  assert.equal(couponDiscount({ type: "FIXED", value: 500000 }, 100000), 100000);
});

await test("priceCart uses server prices and caps quantity to stock", async () => {
  const c = await priceCart([{ variantId: vA.id, quantity: 5 }]);
  assert.equal(c.items[0].quantity, 3);
  assert.equal(c.subtotalMinor, 300000);
  assert.equal(c.issues.length, 1);
  assert.equal(c.shippingMinor, 0); // above free-shipping threshold
});

await test("priceCart drops out-of-stock variants", async () => {
  const c = await priceCart([{ variantId: vB.id, quantity: 1 }]);
  assert.equal(c.items.length, 0);
  assert.match(c.issues[0], /rupture/);
});

await test("checkout refuses a cart that changed (quantity above stock)", async () => {
  await assert.rejects(
    createOrder({ userId: null, lines: [{ variantId: vA.id, quantity: 4 }], customer, address, paymentMethod: "CASH_ON_DELIVERY" }),
    (e: unknown) => e instanceof AppError && e.code === "CHANGED",
  );
});

await test("5 concurrent checkouts for 3 units: exactly 3 succeed, stock never negative", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => createOrder({ userId: null, lines: [{ variantId: vA.id, quantity: 1 }], customer, address, paymentMethod: "CASH_ON_DELIVERY" })),
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  assert.equal(ok.length, 3);
  const v = await db.variant.findUniqueOrThrow({ where: { id: vA.id } });
  assert.equal(v.stock, 0);
});

await test("cancelling an order restocks it", async () => {
  const order = await db.order.findFirstOrThrow({ where: { customerEmail: customer.email, status: "PENDING" } });
  await changeOrderStatus(order.id, "CANCELLED", "test");
  const v = await db.variant.findUniqueOrThrow({ where: { id: vA.id } });
  assert.equal(v.stock, 1);
  const again = changeOrderStatus(order.id, "CONFIRMED", "test");
  await assert.rejects(again, (e: unknown) => e instanceof AppError && e.code === "TRANSITION");
});

await test("COD order delivered becomes paid", async () => {
  const order = await db.order.findFirstOrThrow({ where: { customerEmail: customer.email, status: "PENDING" } });
  await changeOrderStatus(order.id, "CONFIRMED", "test");
  await changeOrderStatus(order.id, "SHIPPED", "test", { trackingNumber: "TRK1" });
  await changeOrderStatus(order.id, "DELIVERED", "test");
  const o = await db.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(o.paymentStatus, "PAID");
  assert.equal(o.trackingNumber, "TRK1");
});

await test("single-use coupon applies once, then is refused", async () => {
  await db.variant.update({ where: { id: vA.id }, data: { stock: 5 } });
  const o1 = await createOrder({ userId: null, lines: [{ variantId: vA.id, quantity: 1 }], couponCode: coupon.code, customer, address, paymentMethod: "CASH_ON_DELIVERY" });
  assert.equal(o1.discountMinor, 10000);
  assert.equal(o1.totalMinor, 100000 - 10000 + 8000); // 90 DT < 200 DT threshold → shipping charged
  await assert.rejects(
    createOrder({ userId: null, lines: [{ variantId: vA.id, quantity: 1 }], couponCode: coupon.code, customer, address, paymentMethod: "CASH_ON_DELIVERY" }),
    (e: unknown) => e instanceof AppError && e.code === "COUPON",
  );
  const v = await db.variant.findUniqueOrThrow({ where: { id: vA.id } });
  assert.equal(v.stock, 4); // failed order did not take stock
});

await test("disabled payment method is refused", async () => {
  await assert.rejects(
    createOrder({ userId: null, lines: [{ variantId: vA.id, quantity: 1 }], customer, address, paymentMethod: "D17" }),
    (e: unknown) => e instanceof AppError && e.code === "PAYMENT",
  );
});

// Cleanup
await db.order.deleteMany({ where: { customerEmail: customer.email } });
await db.product.delete({ where: { id: product.id } });
await db.coupon.delete({ where: { id: coupon.id } });
await db.$disconnect();
console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
