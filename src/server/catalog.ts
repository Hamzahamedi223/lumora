import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Public catalog reads. Everything here is cached (tag "catalog") and invalidated by admin mutations,
 * so storefront pages are served from cache instead of hitting the database on every request.
 * Note: cached values are JSON-serialized — dates come back as strings.
 */
export const CATALOG_TAG = "catalog";
const opts = { tags: [CATALOG_TAG], revalidate: 3600 };

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  priceMinor: true,
  compareAtMinor: true,
  isNew: true,
  madeToOrder: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
  variants: { select: { id: true, name: true, colorHex: true, stock: true }, where: { isActive: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductSelect;

type RawCard = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type ProductCard = Omit<RawCard, "variants"> & {
  colors: { name: string; hex: string }[];
  inStock: boolean;
  rating: { avg: number; count: number } | null;
};

async function ratingsFor(ids: string[]) {
  if (ids.length === 0) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: ids }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.productId, { avg: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]));
}

async function toCards(rows: RawCard[]): Promise<ProductCard[]> {
  const ratings = await ratingsFor(rows.map((r) => r.id));
  return rows.map(({ variants, ...p }) => ({
    ...p,
    colors: variants.filter((v) => v.colorHex).map((v) => ({ name: v.name, hex: v.colorHex! })),
    inStock: p.madeToOrder || variants.some((v) => v.stock > 0),
    rating: ratings.get(p.id) ?? null,
  }));
}

const inStockWhere: Prisma.ProductWhereInput = {
  OR: [{ madeToOrder: true }, { variants: { some: { isActive: true, stock: { gt: 0 } } } }],
};

export const getCategories = unstable_cache(
  async () => {
    const cats = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    });
    return cats.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
  },
  ["categories-v1"],
  opts,
);

export type ShopQuery = {
  category?: string;
  q?: string;
  sort?: "new" | "price-asc" | "price-desc" | "popular";
  min?: number;
  max?: number;
  inStock?: boolean;
  sale?: boolean;
  page?: number;
};

export const PAGE_SIZE = 12;

export const getShopProducts = unstable_cache(
  async (query: ShopQuery) => {
    const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];
    if (query.category) and.push({ category: { slug: query.category } });
    if (query.q) {
      const q = query.q.slice(0, 80);
      and.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tagline: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (query.min != null) and.push({ priceMinor: { gte: query.min } });
    if (query.max != null) and.push({ priceMinor: { lte: query.max } });
    if (query.inStock) and.push(inStockWhere);
    if (query.sale) and.push({ compareAtMinor: { not: null } });
    const where: Prisma.ProductWhereInput = { AND: and };
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      query.sort === "price-asc"
        ? [{ priceMinor: "asc" }]
        : query.sort === "price-desc"
          ? [{ priceMinor: "desc" }]
          : query.sort === "popular"
            ? [{ salesCount: "desc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }];
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const [total, rows] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({ where, orderBy: [...orderBy, { id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect }),
    ]);
    return { total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), items: await toCards(rows) };
  },
  ["shop-v1"],
  opts,
);

export const getFeaturedProducts = unstable_cache(
  async (limit: number) =>
    toCards(
      await db.product.findMany({
        where: { status: "ACTIVE", featured: true },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: cardSelect,
      }),
    ),
  ["featured-v1"],
  opts,
);

export const getBestSellers = unstable_cache(
  async (limit: number) =>
    toCards(
      await db.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: cardSelect,
      }),
    ),
  ["bestsellers-v1"],
  opts,
);

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const p = await db.product.findFirst({
      where: { slug, status: "ACTIVE" },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        priceMinor: true,
        compareAtMinor: true,
        isNew: true,
        madeToOrder: true,
        leadTimeDays: true,
        material: true,
        dimensions: true,
        bulb: true,
        weight: true,
        categoryId: true,
        category: { select: { name: true, slug: true } },
        images: { select: { id: true, url: true, alt: true }, orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, colorHex: true, stock: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, name: true, rating: true, body: true, createdAt: true },
        },
      },
    });
    if (!p) return null;
    const count = p.reviews.length;
    const avg = count ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
    return { ...p, rating: count ? { avg, count } : null };
  },
  ["product-v1"],
  opts,
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, categoryId: string | null) => {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE", id: { not: productId }, ...(categoryId ? { categoryId } : {}) },
      orderBy: [{ salesCount: "desc" }],
      take: 4,
      select: cardSelect,
    });
    return toCards(rows);
  },
  ["related-v1"],
  opts,
);

export const getAllProductSlugs = unstable_cache(
  async () => db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
  ["slugs-v1"],
  opts,
);

export const getHomeReviews = unstable_cache(
  async () =>
    db.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, rating: true, body: true, product: { select: { name: true, slug: true } } },
    }),
  ["home-reviews-v1"],
  opts,
);
