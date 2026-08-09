import { PrismaClient, ProductAvailability } from "@prisma/client"

const prisma = new PrismaClient()

// Планы подкатегорий для каждой игры: матч по подстроке в названии товара (порядок важен).
// Товары, не подошедшие ни под один подшаблон, попадают в "Прочее".
const SUB_CATEGORIES: Record<string, { name: string; match: string[] }[]> = {
  "cs2": [
    { name: "Оружие и скины", match: ["karambit", "knife", "ak-47", "ak ", "m4a4", "m4", "awp", "eagle", "gloves", "skin", "stattrak", "st"] },
    { name: "Кейсы и стикеры", match: ["case", "sticker", "capsule"] },
    { name: "Аккаунты", match: ["account", "акк"] },
    { name: "Прочее", match: [] },
  ],
  "dota-2": [
    { name: "Предметы и рары", match: ["arcana", "immortal", "treasure", "ward", "courier", "rital", "mythical"] },
    { name: "Наборы", match: ["bundle", "set"] },
    { name: "Аккаунты", match: ["account", "акк"] },
    { name: "Прочее", match: [] },
  ],
  "valorant": [
    { name: "Скины", match: ["knife", "gun", "skin", "buddy", "radianite"] },
    { name: "Наборы и карты", match: ["bundle", "card", "spray", "spray card"] },
    { name: "Аккаунты", match: ["account", "акк"] },
    { name: "Прочее", match: [] },
  ],
  "rust": [
    { name: "Оружие и скины", match: ["rifle", "ak", "skin", "skins"] },
    { name: "Строительство", match: ["door", "metal", "building", "blueprint"] },
    { name: "Аккаунты", match: ["account", "акк"] },
    { name: "Прочее", match: [] },
  ],
  "gta-5": [
    { name: "Аккаунты", match: ["account", "акк"] },
    { name: "Транспорт", match: ["vehicle", "car", "машин"] },
    { name: "Внутриигровая валюта", match: ["gta$", "shark", "card", "money", "денег"] },
    { name: "Прочее", match: [] },
  ],
  "warface": [
    { name: "Оружие", match: ["weapon", "оружие"] },
    { name: "Броня и комплекты", match: ["armor", "set", "броня"] },
    { name: "Кейсы и аренда", match: ["crate", "rental", "кейс"] },
    { name: "Прочее", match: [] },
  ],
  "minecraft": [
    { name: "Аккаунты", match: ["account", "акк", "premium", "modded"] },
    { name: "Скины и плащи", match: ["skin", "cape", "плащ"] },
    { name: "Прочее", match: [] },
  ],
}

async function main(): Promise<void> {
  const groups = await prisma.category.findMany({ where: { parentId: null, isActive: true } })

  const fallback = (slug: string) => {
    const group = groups.find((g) => g.slug === slug)
    if (!group) throw new Error(`Категория ${slug} не найдена`)
    return group
  }

  // 1) Создаём дерево подкатегорий
  const subByGame = new Map<string, Map<string, string>>()
  for (const game of groups) {
    const plan = SUB_CATEGORIES[game.slug]
    if (!plan) {
      // игра без плана — гарантируем хотя бы "Прочее"
      await prisma.category.upsert({
        where: { slug: `${game.slug}-prochee` },
        update: {},
        create: { slug: `${game.slug}-prochee`, name: "Прочее", parentId: game.id, sort: 99 },
      })
      continue
    }
    const map = new Map<string, string>()
    let sort = 0
    for (const sub of plan) {
      const slug = `${game.slug}-${slugify(sub.name)}`
      const row = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { slug, name: sub.name, parentId: game.id, sort: sort++ },
      })
      map.set(sub.name, row.id)
    }
    subByGame.set(game.slug, map)
  }

  // 2) Привязать активные товары к подкатегориям по матчу подстрок
  const products = await prisma.product.findMany({
    where: { softDeleted: false },
    select: { id: true, categoryId: true, title: true },
  })

  const categoryById = new Map(groups.map((g) => [g.id, g]))
  let reassigned = 0
  for (const p of products) {
    const game = categoryById.get(p.categoryId)
    if (!game) continue
    const plan = SUB_CATEGORIES[game.slug]
    if (!plan) continue
    const title = p.title.toLowerCase()
    const target =
      plan.find((sub) => sub.match.some((k) => title.includes(k))) ??
      plan[plan.length - 1]! // fallback — "Прочее"
    const parent = subByGame.get(game.slug)!
    const subId = parent.get(target.name)!
    if (p.categoryId !== subId) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: subId } })
      reassigned += 1
    }
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    reassigned,
  }
  console.log("subcategories done:", JSON.stringify(counts))
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’&:]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())