import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { WalletService } from "../wallet/wallet.service.js"
import { PaymentService } from "../payments/payments.service.js"

interface CreateOrderInput {
  idempotencyKey: string
  addressId?: string | null
  productId?: string
  variantId?: string | null
  qty?: number
  itemIds?: string[]
  couponCode?: string
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly payments: PaymentService,
  ) {}

  async create(userId: string, input: CreateOrderInput) {
    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { items: true } })
    if (existing) return existing

    if (input.productId) {
      return this.createDirectOfferOrder(userId, input)
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { inventory: true } } } } },
    })
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({ code: "EMPTY_PURCHASE", message: "Выберите предложение для покупки" })
    }

    const selectedItems = input.itemIds?.length ? cart.items.filter((item) => input.itemIds!.includes(item.id)) : cart.items
    if (selectedItems.length === 0) throw new BadRequestException({ code: "NO_ITEMS", message: "Нет предложений для заказа" })

    return this.createFromItems(userId, input, selectedItems)
  }

  private async createDirectOfferOrder(userId: string, input: CreateOrderInput) {
    const product = await this.prisma.product.findUnique({ include: { inventory: true } , where: { id: input.productId! } })
    if (!product || product.deletedAt) throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Предложение не найдено" })
    if (product.status !== "ACTIVE") throw new BadRequestException({ code: "PRODUCT_UNAVAILABLE", message: "Предложение больше недоступно" })

    const qty = input.qty ?? 1
    if (!product.inventory || product.inventory.stock - product.inventory.reserved < qty) {
      throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: `Предложение «${product.title}» недоступно в нужном количестве` })
    }

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.update({
        where: { id: product.inventory!.id },
        data: { reserved: { increment: qty } },
      })
      if (inventory.reserved > inventory.stock) throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: "Предложение уже было выкуплено другим пользователем" })

      const total = Number(product.price) * qty
      const created = await tx.order.create({
        data: {
          userId, status: "PENDING_PAYMENT", total, currency: product.currency, idempotencyKey: input.idempotencyKey,
          itemsSummary: { itemCount: 1, productTitles: [product.title] } as Prisma.InputJsonValue,
          items: { create: [{ productId: product.id, variantId: input.variantId ?? null, title: product.title, price: product.price, qty }] },
          reservations: { create: { inventoryId: product.inventory!.id, qty, status: "ACTIVE", expiresAt: new Date(Date.now() + 15 * 60 * 1000) } },
        },
        include: { items: true, reservations: true },
      })
      await tx.outboxEvent.create({ data: { eventType: "order.created", payload: { orderId: created.id, userId, total: total.toString() } as Prisma.InputJsonValue } })
      return created
    })
  }

  private async createFromItems(userId: string, input: CreateOrderInput, selectedItems: Array<any>) {
    return this.prisma.$transaction(async (tx) => {
      let total = 0
      const firstProduct = selectedItems[0]!.product
      for (const item of selectedItems) {
        const inventory = item.product.inventory
        if (!inventory || inventory.stock - inventory.reserved < item.qty) {
          throw new BadRequestException({ code: "INSUFFICIENT_STOCK", message: `Товара «${item.product.title}» недостаточно на складе` })
        }
        await tx.inventory.update({ where: { id: inventory.id }, data: { reserved: { increment: item.qty } } })
        total += Number(item.product.price) * item.qty
      }
      const created = await tx.order.create({
        data: {
          userId, status: "PENDING_PAYMENT", total, currency: firstProduct.currency, idempotencyKey: input.idempotencyKey,
          itemsSummary: { itemCount: selectedItems.length, productTitles: selectedItems.slice(0, 3).map((i) => i.product.title) } as Prisma.InputJsonValue,
          items: { create: selectedItems.map((item) => ({ productId: item.productId, variantId: item.variantId, title: item.product.title, price: item.product.price, qty: item.qty })) },
          reservations: { create: { inventoryId: selectedItems[0]!.product.inventory.id, qty: selectedItems.reduce((sum, i) => sum + i.qty, 0), status: "ACTIVE", expiresAt: new Date(Date.now() + 15 * 60 * 1000) } },
        },
        include: { items: true, reservations: true },
      })
      await tx.cartItem.deleteMany({ where: { id: { in: selectedItems.map((i) => i.id) } } })
      await tx.outboxEvent.create({ data: { eventType: "order.created", payload: { orderId: created.id, userId, total: total.toString() } as Prisma.InputJsonValue } })
      return created
    })
  }

  async getById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true, reservations: true } })
    if (!order || order.userId !== userId) throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
    return order
  }

  async payOrder(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      if (order.status !== "PENDING_PAYMENT") throw new BadRequestException({ code: "INVALID_STATUS", message: "Заказ не ожидает оплаты" })
      const payment = await this.payments.processPayment(orderId, userId, Number(order.total))
      if (payment.status === "FAILED") throw new BadRequestException({ code: "INSUFFICIENT_FUNDS", message: "Недостаточно средств на кошельке" })
      await tx.outboxEvent.create({ data: { eventType: "order.paid", payload: { orderId: order.id, userId, amount: order.total.toString() } as Prisma.InputJsonValue } })
      return tx.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } })
    })
    return result
  }

  async listByUser(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { items: { take: 1 } } })
  }

  async confirmReceived(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      if (order.status !== "DELIVERED") throw new BadRequestException({ code: "INVALID_STATUS", message: "Заказ ещё не доставлен" })
      const items = await tx.orderItem.findMany({ where: { orderId } })
      for (const item of items) await tx.inventory.update({ where: { productId: item.productId }, data: { stock: { decrement: item.qty }, reserved: { decrement: item.qty } } })
      await tx.inventoryReservation.updateMany({ where: { orderId }, data: { status: "CONSUMED" } })
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: "COMPLETED" }, include: { items: true } })
      await tx.outboxEvent.create({ data: { eventType: "order.completed", payload: { orderId: order.id, userId } as Prisma.InputJsonValue } })
      return updated
    })
    return result
  }

  async cancel(userId: string, orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order || order.userId !== userId) throw new NotFoundException({ code: "NOT_FOUND", message: "Заказ не найден" })
      if (!["PENDING_PAYMENT", "PAID"].includes(order.status)) throw new BadRequestException({ code: "CANNOT_CANCEL", message: "Нельзя отменить заказ в текущем статусе" })
      const items = await tx.orderItem.findMany({ where: { orderId } })
      for (const item of items) await tx.inventory.update({ where: { productId: item.productId }, data: { reserved: { decrement: item.qty } } })
      if (order.status === "PAID") {
        const paid = await tx.payment.findFirst({ where: { orderId, status: "SUCCEEDED" } })
        if (paid) { await this.wallet.unfreeze(userId, Number(paid.amount)); await tx.payment.update({ where: { id: paid.id }, data: { status: "REFUNDED" } }) }
      }
      await tx.inventoryReservation.updateMany({ where: { orderId }, data: { status: "RELEASED" } })
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" }, include: { items: true } })
      await tx.outboxEvent.create({ data: { eventType: "order.cancelled", payload: { orderId: order.id, userId } as Prisma.InputJsonValue } })
      return updated
    })
    return result
  }
}
