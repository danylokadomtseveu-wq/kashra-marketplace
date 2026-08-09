import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId?: string, guestId?: string) {
    const cart = await this.findCart(userId, guestId)
    if (!cart) {
      return this.createCart(userId, guestId)
    }
    return (
      await this.prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, slug: true, title: true, price: true, currency: true, availability: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    )!
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    input: { productId: string; variantId?: string | null; qty?: number },
  ) {
    const cart = await this.getCart(userId, guestId)
    const qty = Math.max(1, input.qty ?? 1)

    // Валидация stock
    const variant = input.variantId
      ? await this.prisma.productVariant.findUnique({ where: { id: input.variantId } })
      : null
    if (input.variantId && !variant) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Вариант не найден" })
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
      },
    })

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + qty },
      })
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId: input.productId, variantId: input.variantId ?? null, qty },
      })
    }

    return this.getCart(userId, guestId)
  }

  async updateItemQty(userId: string | undefined, guestId: string | undefined, itemId: string, qty: number) {
    const cart = await this.findCart(userId, guestId)
    if (!cart) throw new NotFoundException({ code: "NOT_FOUND", message: "Корзина не найдена" })

    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (!item) throw new NotFoundException({ code: "NOT_FOUND", message: "Товар в корзине не найден" })

    if (qty <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } })
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } })
    }
    return this.getCart(userId, guestId)
  }

  async removeItem(userId: string | undefined, guestId: string | undefined, itemId: string) {
    const cart = await this.findCart(userId, guestId)
    if (!cart) return this.getCart(userId, guestId)
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } })
    return this.getCart(userId, guestId)
  }

  async mergeGuestCart(guestId: string, userId: string) {
    const guestCart = await this.prisma.cart.findUnique({ where: { guestId }, include: { items: true } })
    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userId, undefined)
    }

    const userCart = await this.getCart(userId, undefined)

    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
        },
      })
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + item.qty },
        })
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
          },
        })
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCart.id } })
    return this.getCart(userId, undefined)
  }

  async clearCart(userId?: string, guestId?: string) {
    const cart = await this.findCart(userId, guestId)
    if (!cart) return
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  private async findCart(userId?: string, guestId?: string) {
    if (userId) return this.prisma.cart.findUnique({ where: { userId } })
    if (guestId) return this.prisma.cart.findUnique({ where: { guestId } })
    return null
  }

  private async createCart(userId?: string, guestId?: string) {
    return this.prisma.cart.create({
      data: {
        ...(userId && { userId }),
        ...(guestId && { guestId }),
      },
      include: { items: true },
    })
  }
}
