import { Injectable } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { searchSchema } from "@marketplace/validation"
import type { SearchInput } from "@marketplace/validation"

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(args: SearchInput) {
    const data = searchSchema.parse(args)
    const where: Prisma.ProductWhereInput = {
      softDeleted: false,
      availability: "ACTIVE",
    }

    if (data.q) {
      where.OR = [
        { title: { contains: data.q, mode: "insensitive" } },
        { description: { contains: data.q, mode: "insensitive" } },
      ]
    }
    if (data.brandId) where.brandId = data.brandId
    if (data.sellerId) where.sellerId = data.sellerId
    if (data.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
      if (cat) {
        const children = await this.prisma.category.findMany({
          where: { parentId: cat.id, isActive: true },
          select: { id: true },
        })
        where.categoryId = { in: [cat.id, ...children.map((c) => c.id)] }
      }
    }
    if (data.minPrice !== undefined || data.maxPrice !== undefined) {
      where.price = {
        ...(data.minPrice !== undefined && { gte: data.minPrice }),
        ...(data.maxPrice !== undefined && { lte: data.maxPrice }),
      }
    }
    if (data.inStock) {
      where.inventory = { stock: { gt: 0 } }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      data.sort === "price_asc"
        ? { price: "asc" }
        : data.sort === "price_desc"
          ? { price: "desc" }
          : data.sort === "rating"
            ? { ratingCache: "desc" }
            : data.sort === "newest"
              ? { publishedAt: "desc" }
              : { publishedAt: "desc" }

    const take = Math.min(data.limit, 100)
    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(data.cursor && { cursor: { id: data.cursor }, skip: 1 }),
      include: {
        category: { select: { id: true, slug: true, name: true } },
        brand: { select: { id: true, slug: true, name: true } },
        inventory: { select: { stock: true, reserved: true } },
        seller: {
          select: {
            id: true,
            ratingCache: true,
            salesCount: true,
            user: { select: { id: true, name: true } },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    })

    const hasMore = products.length > take
    const items = hasMore ? products.slice(0, take) : products
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    return { items, nextCursor, count: items.length }
  }
}
