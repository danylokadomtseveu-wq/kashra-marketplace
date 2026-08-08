import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } })
  }
}
