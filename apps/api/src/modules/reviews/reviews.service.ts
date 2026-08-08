import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string, params: { cursor?: string; limit?: number }) {
    const take = Math.min(params.limit ?? 20, 100)
    return this.prisma.review.findMany({
      where: { productId, moderated: true },
      take: take + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    })
  }

  async create(
    userId: string,
    input: { productId: string; rating: number; text: string },
  ) {
    // Проверка что пользователь покупал товар
    const bought = await this.prisma.order.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        items: { some: { productId: input.productId } },
      },
    })
    if (!bought) {
      throw new BadRequestException({ code: "NOT_PURCHASED", message: "Можно оставить отзыв только после покупки" })
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_authorId: { productId: input.productId, authorId: userId } },
    })
    if (existing) {
      throw new BadRequestException({ code: "ALREADY_REVIEWED", message: "Вы уже оставляли отзыв на этот товар" })
    }

    const review = await this.prisma.review.create({
      data: {
        productId: input.productId,
        authorId: userId,
        rating: input.rating,
        text: input.text,
        moderated: false,
      },
    })

    // Обновление кэша рейтинга продукта
    await this.updateProductRating(input.productId)

    return review
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } })
    if (!review || review.authorId !== userId) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Отзыв не найден" })
    }
    await this.prisma.review.delete({ where: { id: reviewId } })
    await this.updateProductRating(review.productId)
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.prisma.review.aggregate({
      where: { productId, moderated: true },
      _avg: { rating: true },
      _count: { _all: true },
    })
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingCache: stats._avg.rating ?? 0,
        reviewCount: stats._count._all,
      },
    })
  }
}
