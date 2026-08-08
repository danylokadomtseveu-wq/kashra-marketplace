import { PrismaClient, Role, ProductAvailability } from "@prisma/client"

const prisma = new PrismaClient()

const CATEGORIES = [
  { slug: "cs2", name: "Counter-Strike 2" },
  { slug: "dota-2", name: "Dota 2" },
  { slug: "valorant", name: "Valorant" },
  { slug: "rust", name: "Rust" },
  { slug: "gta-5", name: "GTA V" },
  { slug: "warface", name: "Warface" },
  { slug: "minecraft", name: "Minecraft" },
] as const

const BRANDS = [
  { slug: "valve", name: "Valve" },
  { slug: "riot-games", name: "Riot Games" },
  { slug: "epic-games", name: "Epic Games" },
  { slug: "faceit", name: "FACEIT" },
] as const

const GAME_SLUGS = {
  "cs2": ["Karambit", "Butterfly Knife", "M4A4", "AK-47", "AWP", "Desert Eagle", "Gloves", "Sticker Capsule", "Agent Skin", "StatTrak", "Case", "Sticker"],
  "dota-2": ["Arcana", "Immortal", "Mythical Set", "Rare Courier", "Treasure", "Bundle", "Ward"],
  "valorant": ["Knife Skin", "Gun Buddy", "Spray", "Player Card", "Bundle", "Radianite"],
  "rust": ["AK Skin", "Semi Rifle", "Metal Door", "Skins Pack", "Blueprint"],
  "gta-5": ["Shark Card", "Vehicle", "GTA$", "Account"],
  "warface": ["Weapon", "Armor Set", "Crate", "Rental Pack"],
  "minecraft": ["Premium Account", "Cape", "Skins", "Modded Account"],
} as Record<string, string[]>

const QUALIFIERS = ["Профи", "Максимум", "Премиум", "Эксклюзив", "Топ", "Elite", "Ultra", "Простой"]

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)] as T
}

async function main(): Promise<void> {
  const rnd = seededRandom(42)
  const now = Date.now()

  await prisma.category.createMany({
    data: CATEGORIES.map((c, i) => ({ ...c, sort: i })),
    skipDuplicates: true,
  })

  await prisma.brand.createMany({
    data: BRANDS.map((b) => ({ ...b })),
    skipDuplicates: true,
  })

  const categoryIds = new Map<string, string>()
  for (const c of CATEGORIES) {
    const row = await prisma.category.findUnique({ where: { slug: c.slug } })
    if (row) categoryIds.set(c.slug, row.id)
  }

  const brandIds = new Map<string, string>()
  for (const b of BRANDS) {
    const row = await prisma.brand.findUnique({ where: { slug: b.slug } })
    if (row) brandIds.set(b.slug, row.id)
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@marketplace.local"
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: process.env.SEED_ADMIN_PASSWORD_HASH ?? "!seed-admin-password-hash!",
      name: "Администратор",
      role: Role.ADMIN,
      emailVerifiedAt: new Date(now),
    },
  })

  const sellers = await Promise.all(
    ["GameWorld", "ProSkins", "TopDeals", "SellerName"].map(async (name, i) => {
      const email = `seller${i + 1}@marketplace.local`
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: `!seed-seller-${i + 1}-password-hash!`,
          name,
          role: Role.SELLER,
          emailVerifiedAt: new Date(now),
          sellerProfile: {
            create: {
              description: `Продавец ${name}`,
              verificationStatus: i === 0 ? "VERIFIED" : "PENDING",
            },
          },
        },
      })
      return user
    }),
  )

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@marketplace.local" },
    update: {},
    create: {
      email: "buyer@marketplace.local",
      passwordHash: "!seed-buyer-password-hash!",
      name: "Покупатель",
      role: Role.USER,
      emailVerifiedAt: new Date(now),
    },
  })

  const productsPerSeller = 12
  let productIndex = 0

  for (const seller of sellers) {
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: seller.id } })
    if (!sellerProfile) continue

    for (let p = 0; p < productsPerSeller; p += 1) {
      const category = pick(rnd, CATEGORIES)
      const names = GAME_SLUGS[category.slug] ?? []
      const baseName = pick(rnd, names)
      const qualifier = pick(rnd, QUALIFIERS)
      const title = `${baseName} ${qualifier}`
      const price = Math.round((50 + rnd() * 4950) * 100) / 100
      const stock = Math.floor(rnd() * 50)
      const hasVariant = rnd() > 0.6
      const slugBase = `${category.slug}-${productIndex}`

      const slug = `${slugBase}-${title
        .toLowerCase()
        .replace(/[^a-z0-9а-я]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)}`

      const product = await prisma.product.create({
        data: {
          slug,
          sellerId: sellerProfile.id,
          categoryId: categoryIds.get(category.slug)!,
          brandId: rnd() > 0.5 ? brandIds.get("valve") ?? brandIds.values().next().value : null,
          title,
          description: `Продаю ${title.toLowerCase()}. Товар цифровой, передача после оплаты.`,
          price,
          oldPrice: rnd() > 0.7 ? price * 1.2 : null,
          currency: "RUB",
          availability: rnd() > 0.1 ? ProductAvailability.ACTIVE : ProductAvailability.SOLD_OUT,
          publishedAt: new Date(now - Math.floor(rnd() * 30) * 86_400_000),
          inventory: {
            create: {
              stock: stock + (rnd() > 0.5 ? 10 : 0),
              reserved: 0,
            },
          },
          ...(hasVariant
            ? {
                variants: {
                  create: [
                    { title: "Стандарт", stock: Math.floor(stock * 0.6) },
                    { title: "Премиум", price, stock: Math.floor(stock * 0.4) },
                  ],
                },
              }
            : {}),
        },
      })

      if (rnd() > 0.5) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: `https://cdn.example.com/placeholder/${category.slug}.webp`,
            alt: title,
          },
        })
      }

      productIndex += 1
    }
  }

  const sampleProducts = await prisma.product.findMany({ take: 3 })
  for (const product of sampleProducts) {
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: buyer.id, productId: product.id } },
      update: {},
      create: { userId: buyer.id, productId: product.id },
    })
    await prisma.review.upsert({
      where: { productId_authorId: { productId: product.id, authorId: buyer.id } },
      update: {},
      create: {
        productId: product.id,
        authorId: buyer.id,
        rating: 4 + Math.floor(rnd() * 2),
        text: "Товар получен быстро, всё соответствует описанию.",
        moderated: true,
      },
    })
  }

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    products: await prisma.product.count(),
    inventory: await prisma.inventory.count(),
    reviews: await prisma.review.count(),
  }
  console.log("seed done:", JSON.stringify(counts))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
