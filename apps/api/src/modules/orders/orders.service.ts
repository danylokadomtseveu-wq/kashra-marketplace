import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { WalletService } from "../wallet/wallet.service.js"
import { PaymentService } from "../payments/payments.service.js"

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly payments: PaymentService,
  ) {}

  async create(userId: string, input: { idempotencyKey: string; itemIds?: string[] }) {
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    })
    if (existing) return existing

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({ code: "EMPTY_CART", message: "Корзина пуста" })
    }

    const selectedItems = input.itemIds?.length
      ? cart.items.filter((item) => input.itemIds!.includes(item.id))
      : cart.items

    if (selectedItems.length === 0) {
      throw new BadRequestException({ code: "NO_ITEMS", message: "Нет товаров для заказа" })
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let total = 0
      let primaryInventoryId = ""
      const firstProduct = selectedItems[0]!.product
      for (const item of selectedItems) {
        const inventory = item.product.inventory
        if (!inventory || inventory.stock - inventory.reserved < item.qty) {
          throw new BadRequestException({
            code: "INSUFFICIENT_STOCK",
            message: `Товара «${item.product.title}» недостаточно на складе`,
          })
        }
        if (!primaryInventoryId) primaryInventoryId = inventory.id
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reserved: { increment: item.qty } },
        })
        const price = item.product.price
        total += Number(price) * item.qty
      }

      const created = await tx.order.create({
        data: {
          userId,
          status: "PENDING_PAYMENT",
          total,
          currency: firstProduct.currency,
          idempotencyKey: input.idempotencyKey,
          itemsSummary: {
            itemCount: selectedItems.length,
            productTitles: selectedItems.slice(0, 3).map((i) => i.product.title),
          } as Prisma.InputJsonValue,
          items: {
            create: selectedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.product.title,
              price: item.product.price,
              qty: item.qty,
            })),
          },
          reservations: {
            create: {
              inventoryId: primaryInventoryId,
              qty: selectedItems.reduce((sum, i) => sum + i.qty, 0),
              status: "ACTIVE",
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
          },
        },
        include: { items: true, reservations: true },
      })

      await tx.cartItem.deleteMany({ where: { id: { in: selectedItems.map((i) => i.id) } } })

      await tx.outboxEvent.create({
        data: {
          eventType: "order.created",
          payload: { orderId: created.id, userId, total: total.toString() } as Prisma.InputJsonValue,
        },
      })

      return created
    })

    return order
  }

  async getById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        reservations: true,
      },
    })
    if (!order || order.userId !== userId) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
    }
    return order
  }

  async payOrder(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      }
      if (order.status !== "PENDING_PAYMENT") {
        throw new BadRequestException({ code: "INVALID_STATUS", message: "Заказ не ожидает оплаты" })
      }

      // Заморозка средств на кошельке (эскроу)
      await this.wallet.freeze(userId, Number(order.total), orderId)

      // Создание платежа
      await this.payments.processPayment(orderId, userId, Number(order.total))

      await tx.outboxEvent.create({
        data: {
          eventType: "order.paid",
          payload: { orderId: order.id, userId, amount: order.total.toString() } as Prisma.InputJsonValue,
        },
      })

      return tx.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } })
    })
    return result
  }

  async listByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: { take: 1 } },
    })
  }

  async confirmReceived(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      }
      if (order.status !== "DELIVERED") {
        throw new BadRequestException({ code: "INVALID_STATUS", message: "Заказ ещё не доставлен" })
      }

      const items = await tx.orderItem.findMany({ where: { orderId } })
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { stock: { decrement: item.qty }, reserved: { decrement: item.qty } },
        })
      }

      await tx.inventoryReservation.updateMany({
        where: { orderId },
        data: { status: "CONSUMED" },
      })

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED" },
        include: { items: true },
      })

      await tx.outboxEvent.create({
        data: {
          eventType: "order.completed",
          payload: { orderId: order.id, userId } as Prisma.InputJsonValue,
        },
      })

      return updated
    })
    return result
  }

  async cancel(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      }
      if (!["PENDING_PAYMENT", "PAID"].includes(order.status)) {
        throw new BadRequestException({ code: "CANNOT_CANCEL", message: "Нельзя отменить заказ в текущем статусе" })
      }

      const items = await tx.orderItem.findMany({ where: { orderId } })
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { reserved: { decrement: item.qty } },
        })
      }

      await tx.inventoryReservation.updateMany({
        where: { orderId },
        data: { status: "RELEASED" },
      })

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: { items: true },
      })

      await tx.outboxEvent.create({
        data: {
          eventType: "order.cancelled",
          payload: { orderId: order.id, userId } as Prisma.InputJsonValue,
        },
      })

      return updated
    })
    return result
  }
}
