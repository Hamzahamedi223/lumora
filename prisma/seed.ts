/**
 * Seed: `npm run db:seed` → admin account, settings, categories and the starter catalog (only if empty).
 *       `npm run db:seed -- --demo` → also demo customers, orders (last 60 days), reviews, coupons, a custom request.
 * Safe to run several times.
 */
import { PrismaClient, type OrderStatus, type PaymentMethod } from "@prisma/client";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";

const db = new PrismaClient();
const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await scrypt(pw, salt, 64)).toString("hex")}`;
}

const C = {
  ivoire: ["Ivoire", "#efe4d2"],
  sable: ["Sable", "#d9b98b"],
  terracotta: ["Terracotta", "#c9714e"],
  sauge: ["Sauge", "#a9b7a0"],
  charbon: ["Charbon", "#3a3633"],
  bleu: ["Bleu Sidi Bou", "#3f7cc4"],
  laiton: ["Laiton", "#c79a55"],
} as const;
type ColorKey = keyof typeof C;

type SeedProduct = {
  slug: string;
  name: string;
  img: string;
  cat: "lampes-a-poser" | "suspensions" | "art-mural";
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  colors: [ColorKey, number][];
  featured?: boolean;
  isNew?: boolean;
  madeToOrder?: boolean;
  leadTimeDays?: number;
  material: string;
  dimensions: string;
  bulb?: string;
  weight: string;
};

const MATERIAL = "PLA biosourcé (amidon de maïs), finition mate";
const PRODUCTS: SeedProduct[] = [
  {
    slug: "aurora", name: "Aurora", img: "aurora", cat: "lampes-a-poser", featured: true,
    tagline: "Lampe à poser à dôme nervuré",
    description:
      "Aurora diffuse une lumière douce et enveloppante à travers un dôme finement nervuré, imprimé d'un seul tenant. Chaque nervure capte la lumière différemment pour dessiner un halo chaleureux sur votre table de chevet ou votre console.\n\nImprimée couche par couche dans notre atelier, puis poncée et contrôlée à la main.",
    price: 129000, compareAt: 149000, colors: [["ivoire", 6], ["sable", 4], ["terracotta", 2]],
    material: MATERIAL, dimensions: "Ø 30 × H 42 cm", bulb: "E27 LED, 9 W max (non fournie)", weight: "1,1 kg",
  },
  {
    slug: "torsade", name: "Torsade", img: "torsade", cat: "lampes-a-poser", featured: true, isNew: true,
    tagline: "Colonne lumineuse en spirale",
    description:
      "Une colonne qui semble tourner sur elle-même. Torsade superpose plus de 400 couches décalées pour créer un mouvement hypnotique, encore plus spectaculaire une fois allumée.\n\nUne pièce sculpturale qui devient le point focal d'un salon.",
    price: 159000, colors: [["ivoire", 5], ["sable", 3]],
    material: MATERIAL, dimensions: "Ø 26 × H 55 cm", bulb: "E27 LED, 9 W max (non fournie)", weight: "1,4 kg",
  },
  {
    slug: "halo", name: "Halo", img: "halo", cat: "lampes-a-poser", featured: true,
    tagline: "Globe lumineux strié",
    description:
      "Un globe parfait, strié de fines lignes horizontales qui adoucissent la lumière. Halo apporte une ambiance feutrée, idéale pour un coin lecture ou une chambre.",
    price: 99000, colors: [["ivoire", 8], ["sauge", 3], ["charbon", 0]],
    material: MATERIAL, dimensions: "Ø 32 × H 45 cm", bulb: "E27 LED, 7 W max (non fournie)", weight: "0,9 kg",
  },
  {
    slug: "kumo", name: "Kumo", img: "kumo", cat: "lampes-a-poser", isNew: true,
    tagline: "Lampe champignon au bord festonné",
    description:
      "Kumo revisite la lampe champignon des années 70 avec un chapeau au bord festonné et un pied évasé. Son abat-jour opaque dirige la lumière vers le bas pour une ambiance intimiste.",
    price: 119000, colors: [["terracotta", 5], ["ivoire", 4], ["sauge", 2]],
    material: MATERIAL, dimensions: "Ø 36 × H 40 cm", bulb: "E14 LED, 5 W max (non fournie)", weight: "1,2 kg",
  },
  {
    slug: "nara", name: "Nara", img: "nara", cat: "lampes-a-poser",
    tagline: "Colonne hélicoïdale élancée",
    description:
      "Élancée et graphique, Nara est parcourue de lignes hélicoïdales qui créent un jeu d'ombres sur toute sa hauteur. Parfaite de part et d'autre d'un canapé.",
    price: 139000, compareAt: 155000, colors: [["ivoire", 4], ["sable", 2]],
    material: MATERIAL, dimensions: "Ø 22 × H 60 cm", bulb: "Ruban LED intégré, 2700 K", weight: "1,0 kg",
  },
  {
    slug: "medina", name: "Médina", img: "medina", cat: "lampes-a-poser", featured: true,
    tagline: "Lanterne inspirée des moucharabiehs",
    description:
      "Hommage aux moucharabiehs de la médina de Tunis : des étoiles à huit branches découpées dans la matière projettent une constellation de lumière sur vos murs. Fabriquée sur commande dans la couleur de votre choix.",
    price: 189000, colors: [["laiton", 0], ["ivoire", 0], ["charbon", 0]], madeToOrder: true, leadTimeDays: 7,
    material: MATERIAL, dimensions: "L 22 × l 22 × H 48 cm", bulb: "E27 LED, 9 W max (non fournie)", weight: "1,3 kg",
  },
  {
    slug: "dune", name: "Dune", img: "dune", cat: "suspensions", featured: true,
    tagline: "Suspension aux strates ondulées",
    description:
      "Comme le vent sculpte les dunes du Sahara, des strates ondulées composent cette suspension généreuse. La lumière filtre entre chaque couche et dessine un motif doux au plafond.",
    price: 219000, compareAt: 249000, colors: [["sable", 3], ["ivoire", 3]],
    material: MATERIAL, dimensions: "Ø 50 × H 34 cm · câble textile 1,5 m", bulb: "E27 LED, 12 W max (non fournie)", weight: "1,6 kg",
  },
  {
    slug: "ondee", name: "Ondée", img: "ondee", cat: "suspensions",
    tagline: "Suspension conique en ondulations",
    description:
      "Des anneaux concentriques en relief composent ce cône léger, pensé pour éclairer une table à manger ou un îlot de cuisine. Disponible en plusieurs teintes naturelles.",
    price: 179000, colors: [["ivoire", 5], ["charbon", 2], ["sauge", 2]],
    material: MATERIAL, dimensions: "Ø 45 × H 30 cm · câble textile 1,5 m", bulb: "E27 LED, 12 W max (non fournie)", weight: "1,2 kg",
  },
  {
    slug: "atlas", name: "Atlas", img: "atlas", cat: "art-mural", isNew: true,
    tagline: "Relief topographique",
    description:
      "Une carte en relief imaginaire, inspirée des courbes de niveau de l'Atlas tunisien. Chaque strate est imprimée séparément puis assemblée pour un effet de profondeur saisissant sous une lumière rasante.",
    price: 145000, colors: [["sable", 4], ["ivoire", 2]],
    material: MATERIAL, dimensions: "40 × 50 × 3 cm · fixation murale incluse", weight: "1,5 kg",
  },
  {
    slug: "sidi-bou", name: "Sidi Bou", img: "sidibou", cat: "art-mural", featured: true,
    tagline: "Tableau vagues bleu et blanc",
    description:
      "Le bleu et le blanc de Sidi Bou Saïd en vagues superposées. Un tableau en relief qui apporte la Méditerranée dans votre intérieur.",
    price: 165000, colors: [["bleu", 5]],
    material: MATERIAL, dimensions: "40 × 50 × 2,5 cm · fixation murale incluse", weight: "1,3 kg",
  },
  {
    slug: "geode", name: "Géode", img: "geode", cat: "art-mural",
    tagline: "Composition d'hexagones à facettes",
    description:
      "Neuf hexagones à facettes composent une pièce murale modulable. Disposez-les selon votre envie : en grappe, en ligne ou en nid d'abeille.",
    price: 95000, colors: [["sauge", 6], ["ivoire", 4], ["terracotta", 3]],
    material: MATERIAL, dimensions: "9 modules de 20 cm · gabarit de pose inclus", weight: "0,9 kg",
  },
  {
    slug: "carthage", name: "Soleil de Carthage", img: "carthage", cat: "art-mural",
    tagline: "Miroir soleil en rayons sculptés",
    description:
      "Trente-six rayons sculptés autour d'un cœur en relief. Le Soleil de Carthage réchauffe un mur d'entrée ou de salon avec la chaleur d'une finition laiton.",
    price: 175000, colors: [["laiton", 3], ["ivoire", 1]],
    material: MATERIAL, dimensions: "Ø 70 cm · fixation murale incluse", weight: "1,4 kg",
  },
];

const CATEGORIES = [
  { slug: "lampes-a-poser", name: "Lampes à poser", description: "Lampes de table, de chevet et de bureau.", image: "/catalog/aurora-lit.webp", sortOrder: 1 },
  { slug: "suspensions", name: "Suspensions", description: "Suspensions pour salon, salle à manger et cuisine.", image: "/catalog/dune-lit.webp", sortOrder: 2 },
  { slug: "art-mural", name: "Art mural", description: "Tableaux et reliefs muraux sculptés.", image: "/catalog/sidibou-day.webp", sortOrder: 3 },
];

async function seedCore() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ chars) in .env / .env.local");
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    await db.user.create({ data: { email, name: "Administrateur", role: "ADMIN", passwordHash: await hashPassword(password) } });
    console.log(`Admin created: ${email}`);
  } else if (existing.role !== "ADMIN") {
    await db.user.update({ where: { email }, data: { role: "ADMIN" } });
  }

  await db.setting.upsert({ where: { key: "store" }, update: {}, create: { key: "store", value: {} } });

  for (const c of CATEGORIES) await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });

  if ((await db.product.count()) === 0) {
    const cats = await db.category.findMany();
    for (const [i, p] of PRODUCTS.entries()) {
      await db.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          categoryId: cats.find((c) => c.slug === p.cat)!.id,
          priceMinor: p.price,
          compareAtMinor: p.compareAt ?? null,
          status: "ACTIVE",
          featured: !!p.featured,
          isNew: !!p.isNew,
          madeToOrder: !!p.madeToOrder,
          leadTimeDays: p.leadTimeDays ?? null,
          material: p.material,
          dimensions: p.dimensions,
          bulb: p.bulb ?? null,
          weight: p.weight,
          createdAt: new Date(Date.now() - (PRODUCTS.length - i) * 864e5 * 3),
          images: {
            create: [
              { url: `/catalog/${p.img}-lit.webp`, alt: `${p.name} allumée`, sortOrder: 0 },
              { url: `/catalog/${p.img}-day.webp`, alt: `${p.name} de jour`, sortOrder: 1 },
            ],
          },
          variants: {
            create: p.colors.map(([key, stock], j) => ({
              name: C[key][0],
              colorHex: C[key][1],
              sku: `LUM-${p.slug.toUpperCase()}-${key.toUpperCase()}`,
              stock,
              sortOrder: j,
              movements: stock > 0 ? { create: { delta: stock, reason: "ADJUSTMENT", note: "Stock initial" } } : undefined,
            })),
          },
        },
      });
    }
    console.log(`${PRODUCTS.length} products created`);
  }
}

async function seedDemo() {
  if ((await db.order.count()) > 0) {
    console.log("Demo data skipped (orders already exist)");
    return;
  }
  const names = [
    "Yasmine Ben Ali", "Mehdi Trabelsi", "Salma Gharbi", "Karim Jaziri", "Ines Bouazizi", "Omar Haddad",
    "Nour Mansouri", "Amine Chebbi", "Rania Ayari", "Hichem Ferchichi", "Leila Saidi", "Walid Kammoun",
  ];
  const govs = ["Tunis", "Ariana", "Sousse", "Sfax", "Nabeul", "Monastir", "Ben Arous", "Bizerte"];
  const pw = await hashPassword(randomBytes(12).toString("hex"));
  const users = [];
  for (const [i, n] of names.slice(0, 8).entries()) {
    const email = `${n.split(" ")[0].toLowerCase()}.demo${i}@example.com`;
    users.push(
      await db.user.upsert({
        where: { email },
        update: {},
        create: { email, name: n, phone: `+216 2${i} 4${i}5 ${i}${i}${i}`, passwordHash: pw, createdAt: new Date(Date.now() - (70 - i * 6) * 864e5) },
      }),
    );
  }
  const products = await db.product.findMany({ include: { variants: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } });
  let s = 42;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

  for (let i = 0; i < 64; i++) {
    const daysAgo = Math.floor(r() * r() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 864e5 - Math.floor(r() * 12 * 36e5));
    const n = r() < 0.7 ? 1 : 2;
    const chosen = Array.from({ length: n }, () => pick(products));
    const lines = [...new Set(chosen)].map((p) => {
      const v = pick(p.variants);
      const q = r() < 0.85 ? 1 : 2;
      return { p, v, q };
    });
    const subtotal = lines.reduce((t, l) => t + l.p.priceMinor * l.q, 0);
    const shipping = subtotal >= 200000 ? 0 : 8000;
    const status: OrderStatus =
      daysAgo < 2 ? pick(["PENDING", "PENDING", "CONFIRMED"] as OrderStatus[])
      : daysAgo < 6 ? pick(["CONFIRMED", "SHIPPED", "SHIPPED"] as OrderStatus[])
      : r() < 0.08 ? "CANCELLED" : r() < 0.03 ? "RETURNED" : "DELIVERED";
    const method: PaymentMethod = r() < 0.8 ? "CASH_ON_DELIVERY" : "BANK_TRANSFER";
    const u = r() < 0.55 ? pick(users) : null;
    const name = u?.name ?? pick(names);
    const number = `LUM-${createdAt.toISOString().slice(2, 10).replace(/-/g, "")}-D${String(i).padStart(4, "0")}`;
    await db.order.create({
      data: {
        number,
        userId: u?.id ?? null,
        status,
        paymentStatus: status === "DELIVERED" ? "PAID" : status === "RETURNED" ? "REFUNDED" : "UNPAID",
        paymentMethod: method,
        customerName: name,
        customerEmail: u?.email ?? `client${i}@example.com`,
        customerPhone: `+216 9${i % 10} ${100 + i} ${200 + i}`,
        governorate: pick(govs),
        city: "Centre-ville",
        addressLine: `${1 + i} rue de la Liberté`,
        subtotalMinor: subtotal,
        shippingMinor: shipping,
        totalMinor: subtotal + shipping,
        trackingToken: randomBytes(18).toString("base64url"),
        createdAt,
        items: {
          create: lines.map((l) => ({
            productId: l.p.id,
            variantId: l.v.id,
            name: l.p.name,
            variantName: l.v.name,
            image: l.p.images[0]?.url ?? null,
            unitPriceMinor: l.p.priceMinor,
            quantity: l.q,
            lineTotalMinor: l.p.priceMinor * l.q,
            madeToOrder: l.p.madeToOrder,
          })),
        },
        events: { create: [{ status: "PENDING", note: "Commande passée", actor: "client", createdAt }, ...(status !== "PENDING" ? [{ status, note: "Démo", actor: "admin", createdAt }] : [])] },
      },
    });
    if (status !== "CANCELLED")
      for (const l of lines) await db.product.update({ where: { id: l.p.id }, data: { salesCount: { increment: l.q } } });
  }

  const reviews = [
    ["Aurora", "Yasmine B.", 5, "Magnifique en vrai, la lumière est très douce. Emballage soigné et livraison rapide à Tunis."],
    ["Aurora", "Karim J.", 5, "Encore plus belle que sur les photos. Tout le monde me demande d'où elle vient !"],
    ["Torsade", "Salma G.", 5, "Une vraie pièce d'art. Allumée le soir, c'est hypnotique."],
    ["Dune", "Mehdi T.", 4, "Très belle suspension au-dessus de notre table. Montage simple."],
    ["Halo", "Ines B.", 5, "Parfaite pour la chambre de ma fille, lumière tamisée idéale."],
    ["Sidi Bou", "Nour M.", 5, "Le bleu est sublime, ça apporte une touche méditerranéenne à l'entrée."],
    ["Médina", "Omar H.", 5, "Les étoiles projetées sur les murs sont incroyables. Délai respecté."],
    ["Kumo", "Rania A.", 4, "Jolie couleur terracotta, finition mate très agréable."],
  ] as const;
  for (const [pname, name, rating, body] of reviews) {
    const p = products.find((x) => x.name === pname);
    if (p) await db.review.create({ data: { productId: p.id, name, rating, body, status: "APPROVED", createdAt: new Date(Date.now() - Math.floor(r() * 40) * 864e5) } });
  }
  const torsade = products.find((p) => p.slug === "torsade");
  if (torsade) await db.review.create({ data: { productId: torsade.id, name: "Amine C.", rating: 5, body: "Commandée pour un cadeau, emballage parfait. Je recommande !", status: "PENDING" } });

  await db.coupon.createMany({
    data: [
      { code: "BIENVENUE10", type: "PERCENT", value: 10, minSubtotalMinor: 80000 },
      { code: "LUMIERE20", type: "FIXED", value: 20000, minSubtotalMinor: 150000, maxUses: 50, usedCount: 7 },
    ],
    skipDuplicates: true,
  });
  await db.customRequest.create({
    data: {
      number: "SM-DEMO-0001",
      name: "Leila Saidi",
      email: "leila.demo@example.com",
      phone: "+216 22 333 444",
      type: "LAMP",
      description: "Je cherche une suspension XL (Ø 70 cm) dans l'esprit de Dune pour un restaurant à La Marsa, teinte sable.",
      dimensions: "Ø 70 cm",
      colors: "Sable",
      budget: "400 – 600 DT",
      deadline: "Fin du mois",
    },
  });
  await db.contactMessage.create({
    data: { name: "Walid Kammoun", email: "walid.demo@example.com", subject: "Commande pour un hôtel", message: "Bonjour, nous aimerions équiper 20 chambres avec la lampe Halo. Proposez-vous des tarifs professionnels ?" },
  });
  console.log("Demo data created (customers, 64 orders, reviews, coupons BIENVENUE10 / LUMIERE20, custom request, message)");
}

seedCore()
  .then(() => (process.argv.includes("--demo") ? seedDemo() : undefined))
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
