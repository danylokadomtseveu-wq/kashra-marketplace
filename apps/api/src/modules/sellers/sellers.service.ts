import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, createdAt: true } },
      },
    })
    if (!profile) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Продавец не найден" })
    }
    return profile
  }

  async upsertMe(
    userId: string,
    data: { name?: string; description?: string },
  ) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } })

    const profile = existing
      ? await this.prisma.sellerProfile.update({
          where: { userId },
          data: { description: data.description ?? existing.description },
        })
      : await this.prisma.sellerProfile.create({
          data: { userId, description: data.description ?? "" },
        })

    if (data.name !== undefined) {
      await this.prisma.user.update({ where: { id: userId }, data: { name: data.name } })
    }

    if (!existing) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: "SELLER" },
      })
    }

    return this.getById(profile.id)
  }

  async getMyProducts(userId: string, params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } })
    if (!seller) throw new NotFoundException({ code: "NOT_FOUND", message: "Профиль продавца не найден" })

    return this.prisma.product.findMany({
      where: { sellerId: seller.id, softDeleted: false },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        inventory: { select: { stock: true, reserved: true } },
        images: { orderBy: { sort: "asc" } },
      },
    })
  }

  async getMyOrders(userId: string, params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } })
    if (!seller) throw new NotFoundException({ code: "NOT_FOUND", message: "Профиль продавца не найден" })

    return this.prisma.order.findMany({
      where: { items: { some: { product: { sellerId: seller.id } } } },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { id: true, title: true } } } },
        user: { select: { id: true, name: true } },
      },
    })
  }

  async getStats(userId: string) {
    const seller = await this.prisma.sellerProfile.findUnique({ where: { userId } })
    if (!seller) throw new NotFoundException({ code: "NOT_FOUND", message: "Профиль продавца не найден" })

    const [productCount, orderCount, revenue] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id, softDeleted: false } }),
      this.prisma.order.count({ where: { items: { some: { product: { sellerId: seller.id } } }, status: "COMPLETED" } }),
      this.prisma.order.aggregate({
        where: { items: { some: { product: { sellerId: seller.id } } }, status: "COMPLETED" },
        _sum: { total: true },
      }),
    ])

    return {
      productCount,
      orderCount,
      revenue: revenue._sum.total?.toString() ?? "0",
      ratingCache: seller.ratingCache.toString(),
      salesCount: seller.salesCount,
    }
  }
}
