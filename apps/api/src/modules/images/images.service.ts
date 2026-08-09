import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { StorageService, type StoredObject } from "../storage/storage.service.js"

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async assertOwner(productId: string, userId: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { userId: true } } },
    })
    if (!product || product.softDeleted) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Товар не найден" })
    }
    if (product.seller.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Нет прав на изменение товара" })
    }
    return product
  }

  async createImages(productId: string, uploads: StoredObject[]) {
    const max = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sort: true },
    })
    const base = max._max.sort ?? 0
    return this.prisma.productImage.createMany({
      data: uploads.map((u, i) => ({
        productId,
        url: u.url,
        key: u.key,
        alt: "",
        sort: base + i + 1,
      })),
    })
  }

  async delete(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image || image.productId !== productId) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Изображение не найдено" })
    }
    if (image.key) await this.storage.delete(image.key)
    await this.prisma.productImage.delete({ where: { id: imageId } })
    return { ok: true }
  }
}
