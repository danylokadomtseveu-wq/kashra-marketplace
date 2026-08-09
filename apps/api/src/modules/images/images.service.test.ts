import { describe, it, expect, vi, beforeEach } from "vitest"
import { NotFoundException, ForbiddenException } from "@nestjs/common"
import { ImagesService } from "./images.service.js"
import type { PrismaService } from "../prisma/prisma.service.js"
import type { StorageService } from "../storage/storage.service.js"

function makePrisma(): { product: { findUnique: ReturnType<typeof vi.fn> }; productImage: Record<string, ReturnType<typeof vi.fn>> } {
  return {
    product: { findUnique: vi.fn() },
    productImage: {
      aggregate: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  }
}

describe("ImagesService.assertOwner", () => {
  let service: ImagesService
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    prisma = makePrisma()
    service = new ImagesService(prisma as unknown as PrismaService, {} as unknown as StorageService)
  })

  it("возвращает товар, если пользователь является владельцем", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p-1", softDeleted: false, seller: { userId: "u-1" } })
    const result = await service.assertOwner("p-1", "u-1")
    expect(result.id).toBe("p-1")
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: "p-1" },
      include: { seller: { select: { userId: true } } },
    })
  })

  it("разрешает администратору доступ к чужому товару", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p-1", softDeleted: false, seller: { userId: "u-2" } })
    const result = await service.assertOwner("p-1", "u-1", "ADMIN")
    expect(result.id).toBe("p-1")
  })

  it("выбрасывает NotFoundException, если товар не найден", async () => {
    prisma.product.findUnique.mockResolvedValue(null)
    await expect(service.assertOwner("p-x", "u-1")).rejects.toThrow(NotFoundException)
  })

  it("выбрасывает NotFoundException для удалённого товара", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p-1", softDeleted: true, seller: { userId: "u-1" } })
    await expect(service.assertOwner("p-1", "u-1")).rejects.toThrow(NotFoundException)
  })

  it("выбрасывает ForbiddenException для чужого товара без админства", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "p-1", softDeleted: false, seller: { userId: "u-2" } })
    await expect(service.assertOwner("p-1", "u-1")).rejects.toThrow(ForbiddenException)
  })
})
