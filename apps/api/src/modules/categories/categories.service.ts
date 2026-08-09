import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { CacheService } from "../cache/cache.service.js"

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findMany() {
    return this.cache.getOrSet(
      "categories:all",
      async () => {
        const all = await this.prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sort: "asc" },
          include: {
            _count: {
              select: {
                products: { where: { availability: "ACTIVE", softDeleted: false } },
              },
            },
          },
        })

        const byParent = new Map<string, typeof all>()
        for (const c of all) {
          if (!c.parentId) continue
          const list = byParent.get(c.parentId) ?? []
          list.push(c)
          byParent.set(c.parentId, list)
        }

        return all
          .filter((c) => !c.parentId)
          .map((root) => {
            const children = byParent.get(root.id) ?? []
            const total =
              root._count.products + children.reduce((acc, ch) => acc + ch._count.products, 0)
            return {
              ...root,
              children: children.map((ch) => ({ ...ch, children: [] })),
              _count: { products: total },
            }
          })
      },
      3600,
    )
  }

  async findBySlug(slug: string) {
    const root = await this.prisma.category.findUnique({ where: { slug } })
    if (!root) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Категория не найдена" })
    }
    const activeWhere = { availability: "ACTIVE", softDeleted: false } as const
    const children = await this.prisma.category.findMany({
      where: { parentId: root.id, isActive: true },
      orderBy: { sort: "asc" },
      include: {
        _count: {
          select: { products: { where: activeWhere } },
        },
      },
    })
    const rootCount = await this.prisma.product.count({
      where: { categoryId: root.id, availability: "ACTIVE", softDeleted: false },
    })
    return {
      ...root,
      children,
      _count: { products: rootCount + children.reduce((acc, ch) => acc + ch._count.products, 0) },
    }
  }
}