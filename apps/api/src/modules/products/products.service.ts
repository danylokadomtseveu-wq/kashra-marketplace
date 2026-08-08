import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma, ProductAvailability } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { productSchema } from "@marketplace/validation"
import type { ProductInput } from "@marketplace/validation"

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: {
    categoryId?: string
    brandId?: string
    sellerId?: string
    availability?: string
    cursor?: string
    limit?: number
  }) {
    const where: Prisma.ProductWhereInput = {
      softDeleted: false,
      availability: (args.availability as ProductAvailability) ?? "ACTIVE",
      ...(args.categoryId && { categoryId: args.categoryId }),
      ...(args.brandId && { brandId: args.brandId }),
      ...(args.sellerId && { sellerId: args.sellerId }),
    }

    const take = Math.min(args.limit ?? 20, 100)
    return this.prisma.product.findMany({
      where,
      take: take + 1,
      ...(args.cursor && { cursor: { id: args.cursor }, skip: 1 }),
      orderBy: { publishedAt: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        brand: { select: { id: true, slug: true, name: true } },
        inventory: { select: { stock: true, reserved: true } },
        _count: { select: { reviews: true } },
      },
    })
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sort: "asc" } },
        variants: true,
        inventory: true,
        seller: { include: { user: { select: { id: true, name: true } } } },
      },
    })
    if (!product || product.softDeleted) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Товар не найден" })
    }
    return product
  }

  async create(sellerProfileId: string, input: ProductInput) {
    const data = productSchema.parse(input)
    return this.prisma.product.create({
      data: {
        slug: data.slug,
        sellerId: sellerProfileId,
        categoryId: data.categoryId,
        brandId: data.brandId ?? null,
        title: data.title,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice ?? null,
        currency: data.currency,
        availability: "ACTIVE",
        attrs: data.attrs as Prisma.InputJsonValue,
        inventory: { create: { stock: data.stock, reserved: 0 } },
        ...(data.variants?.length
          ? { variants: { createMany: { data: data.variants } } }
          : {}),
      },
    })
  }

  async update(productId: string, sellerProfileId: string, input: Partial<ProductInput>) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product || product.softDeleted) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Товар не найден" })
    }
    if (product.sellerId !== sellerProfileId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Нет прав на редактирование" })
    }

    const data = productSchema.partial().parse(input)
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.oldPrice !== undefined && { oldPrice: data.oldPrice }),
        ...(data.attrs !== undefined && { attrs: data.attrs as Prisma.InputJsonValue }),
      },
    })
  }

  async softDelete(productId: string, sellerProfileId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product || product.softDeleted) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Товар не найден" })
    }
    if (product.sellerId !== sellerProfileId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Нет прав на удаление" })
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { softDeleted: true, availability: "HIDDEN" },
    })
  }
}
