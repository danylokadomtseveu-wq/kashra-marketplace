import { BadRequestException, Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    const now = new Date()
    return this.prisma.promotion.findMany({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: "desc" },
    })
  }

  async validateCoupon(userId: string, code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon) {
      throw new BadRequestException({ code: "NOT_FOUND", message: "Промокод не найден" })
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException({ code: "EXPIRED", message: "Промокод истёк" })
    }
    if (coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException({ code: "EXHAUSTED", message: "Промокод исчерпан" })
    }
    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    }
  }
}
