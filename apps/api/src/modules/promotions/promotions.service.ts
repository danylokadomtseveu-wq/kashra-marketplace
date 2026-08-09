import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"

export interface CouponContext {
  cartTotal?: number
  itemProductIds?: string[]
}

export interface CouponValidation {
  code: string
  type: "PERCENT" | "FIXED"
  value: string
  discount: number
  finalTotal: number
}

type CouponSnapshot = {
  id: string
  code: string
  type: string
  value: Prisma.Decimal
  minAmount: Prisma.Decimal | null
  expiresAt: Date | null
  usedCount: number
  maxUses: number
  usagePerUser: number
scope: Prisma.JsonValue
}

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v)
}

export function calcDiscount(type: string, value: number, total: number): number {
  if (type === "PERCENT") {
    return (total * value) / 100
  }
  return Math.min(value, total)
}

function scopeRecord(scope: Prisma.JsonValue): Record<string, unknown> | null {
  if (scope == null || typeof scope !== "object") return null
  return scope as Record<string, unknown>
}

function selectCoupon() {
  return {
    id: true,
    code: true,
    type: true,
    value: true,
    minAmount: true,
    expiresAt: true,
    usedCount: true,
    maxUses: true,
    usagePerUser: true,
    scope: true,
  } as const
}

function assertUsable(coupon: CouponSnapshot): void {
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new BadRequestException({ code: "EXPIRED", message: "Промокод истёк" })
  }
  if (coupon.usedCount >= coupon.maxUses) {
    throw new BadRequestException({ code: "EXHAUSTED", message: "Промокод исчерпан" })
  }
}

function assertCartConstraints(coupon: CouponSnapshot, ctx?: CouponContext): void {
  const scope = scopeRecord(coupon.scope)
  if (ctx?.cartTotal != null && coupon.minAmount != null) {
    if (ctx.cartTotal < Number(coupon.minAmount)) {
      throw new BadRequestException({
        code: "MIN_AMOUNT",
        message: `Минимальная сумма заказа ${Number(coupon.minAmount).toLocaleString("ru-RU")} ₽`,
      })
    }
  }
  if (scope?.productId && ctx?.itemProductIds) {
    if (!ctx.itemProductIds.includes(String(scope.productId))) {
      throw new BadRequestException({ code: "SCOPE_MISMATCH", message: "Промокод не применяется к этим товарам" })
    }
  }
}

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

  async validateCoupon(userId: string, code: string, ctx?: CouponContext): Promise<CouponValidation> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      select: selectCoupon(),
    })
    if (!coupon) {
      throw new BadRequestException({ code: "NOT_FOUND", message: "Промокод не найден" })
    }
    assertUsable(coupon)
    if (coupon.usagePerUser > 0) {
      const usedByUser = await this.prisma.couponUsage.count({ where: { userId, couponId: coupon.id } })
      if (usedByUser >= coupon.usagePerUser) {
        throw new BadRequestException({ code: "USAGE_EXHAUSTED", message: "Вы исчерпали лимит использований этого промокода" })
      }
    }
    assertCartConstraints(coupon, ctx)

    const total = ctx?.cartTotal ?? 0
    const discount = calcDiscount(coupon.type, toNumber(coupon.value), total)
    const finalTotal = Math.max(0, total - discount)

    return {
      code: coupon.code,
      type: coupon.type as "PERCENT" | "FIXED",
      value: coupon.value.toString(),
      discount,
      finalTotal,
    }
  }

  async reserveCoupon(
    tx: Prisma.TransactionClient,
    userId: string,
    code: string,
    ctx: Required<CouponContext>,
  ): Promise<{ coupon: CouponSnapshot; discount: number; finalTotal: number }> {
    const coupon = await tx.coupon.findUnique({
      where: { code: code.toUpperCase() },
      select: selectCoupon(),
    })
    if (!coupon) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Промокод не найден" })
    }
    assertUsable(coupon)
    if (coupon.usagePerUser > 0) {
      const usedByUser = await tx.couponUsage.count({ where: { userId, couponId: coupon.id } })
      if (usedByUser >= coupon.usagePerUser) {
        throw new BadRequestException({ code: "USAGE_EXHAUSTED", message: "Вы исчерпали лимит использований этого промокода" })
      }
    }
    assertCartConstraints(coupon, ctx)

    const discount = calcDiscount(coupon.type, toNumber(coupon.value), ctx.cartTotal)
    const finalTotal = Math.max(0, ctx.cartTotal - discount)
    return { coupon, discount, finalTotal }
  }

  async recordCouponUsage(
    tx: Prisma.TransactionClient,
    couponId: string,
    orderId: string,
    userId: string,
  ): Promise<void> {
    await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } })
    await tx.couponUsage.create({ data: { userId, couponId, orderId } })
  }
}
