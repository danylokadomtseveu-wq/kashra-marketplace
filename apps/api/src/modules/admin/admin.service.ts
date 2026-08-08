import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [users, products, orders, revenue, pendingReviews] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { softDeleted: false } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
      this.prisma.review.count({ where: { moderated: false } }),
    ])

    return {
      users,
      products,
      orders,
      revenue: revenue._sum.total?.toString() ?? "0",
      pendingReviews,
    }
  }

  async listUsers(params: { cursor?: string; limit?: number; search?: string }) {
    const take = Math.min(params.limit ?? 20, 100)
    return this.prisma.user.findMany({
      where: params.search
        ? { OR: [{ email: { contains: params.search, mode: "insensitive" } }, { name: { contains: params.search, mode: "insensitive" } }] }
        : undefined,
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    })
  }

  async updateUserStatus(userId: string, status: "ACTIVE" | "BANNED") {
    return this.prisma.user.update({ where: { id: userId }, data: { status } })
  }

  async moderateListing(productId: string, action: "approve" | "hide") {
    return this.prisma.product.update({
      where: { id: productId },
      data: { softDeleted: action === "hide", availability: action === "hide" ? "HIDDEN" : "ACTIVE" },
    })
  }

  async moderateReview(reviewId: string, action: "approve" | "delete") {
    if (action === "delete") {
      return this.prisma.review.delete({ where: { id: reviewId } })
    }
    return this.prisma.review.update({ where: { id: reviewId }, data: { moderated: true } })
  }

  async listProducts(params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    return this.prisma.product.findMany({
      where: { softDeleted: false },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    })
  }

  async listPendingReviews(params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    return this.prisma.review.findMany({
      where: { moderated: false },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    })
  }

  async listDisputes(params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    return this.prisma.order.findMany({
      where: { status: "DISPUTED" },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async resolveDispute(orderId: string, resolution: "refund" | "complete") {
    if (resolution === "refund") {
      return this.prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } })
    }
    return this.prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } })
  }
}
