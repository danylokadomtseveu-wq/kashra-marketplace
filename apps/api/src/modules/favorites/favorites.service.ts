import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            inventory: { select: { stock: true } },
          },
        },
      },
    })
    return favorites
  }

  async add(userId: string, productId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    })
    if (existing) return existing
    return this.prisma.favorite.create({ data: { userId, productId } })
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favorite
      .delete({ where: { userId_productId: { userId, productId } } })
      .catch(() => {
        // already removed
      })
  }
}
