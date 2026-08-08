import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { CacheService } from "../cache/cache.service.js"

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findMany() {
    return this.cache.getOrSet(
      "categories:all",
      () => this.prisma.category.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } }),
      3600,
    )
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } })
    if (!category) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Категория не найдена" })
    }
    return category
  }
}
