import { BadRequestException, Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.walletBalance.findUnique({ where: { userId } })
    if (!wallet) {
      return this.prisma.walletBalance.create({
        data: { userId, available: 0, frozen: 0 },
      })
    }
    return wallet
  }

  async topUp(userId: string, amount: number, idempotencyKey: string) {
    if (amount <= 0) {
      throw new BadRequestException({ code: "INVALID_AMOUNT", message: "Сумма должна быть положительной" })
    }

    // Идемпотентность пополнения
    const existing = await this.prisma.payment.findUnique({ where: { providerPaymentId: idempotencyKey } })
    if (existing) return this.getBalance(userId)

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.walletBalance.upsert({
        where: { userId },
        create: { userId, available: amount.toString() },
        update: { available: { increment: amount.toString() } },
      })

      await tx.payment.create({
        data: {
          userId,
          walletBalanceId: wallet.id,
          provider: "WALLET",
          providerPaymentId: idempotencyKey,
          amount: amount.toString(),
          status: "SUCCEEDED",
        },
      })

      return wallet
    })
  }

  // Заморозка средств при создании заказа (эскроу)
  async freeze(userId: string, amount: number, _orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.walletBalance.findUnique({ where: { userId } })
      if (!wallet || wallet.available.toNumber() < amount) {
        throw new BadRequestException({ code: "INSUFFICIENT_FUNDS", message: "Недостаточно средств" })
      }

      return tx.walletBalance.update({
        where: { userId },
        data: {
          available: { decrement: amount.toString() },
          frozen: { increment: amount.toString() },
        },
      })
    })
  }

  // Списание замороженных средств (подтверждение заказа)
  async capture(userId: string, amount: number) {
    return this.prisma.walletBalance.update({
      where: { userId },
      data: { frozen: { decrement: amount.toString() } },
    })
  }

  // Разморозка (отмена заказа)
  async unfreeze(userId: string, amount: number) {
    return this.prisma.walletBalance.update({
      where: { userId },
      data: {
        frozen: { decrement: amount.toString() },
        available: { increment: amount.toString() },
      },
    })
  }

  // Начисление продавцу
  async credit(sellerUserId: string, amount: number) {
    return this.prisma.walletBalance.upsert({
      where: { userId: sellerUserId },
      create: { userId: sellerUserId, available: amount.toString() },
      update: { available: { increment: amount.toString() } },
    })
  }
}
