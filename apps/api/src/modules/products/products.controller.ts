import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ProductsService } from "./products.service.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { Public } from "../auth/decorators/public.decorator.js"

@Controller("products")
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  findMany(
    @Query("categoryId") categoryId?: string,
    @Query("brandId") brandId?: string,
    @Query("sellerId") sellerId?: string,
    @Query("availability") availability?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.products.findMany({
      categoryId,
      brandId,
      sellerId,
      availability,
      cursor,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Public()
  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.products.findBySlug(slug)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const seller = await this.getSellerProfileId(userId)
    return this.products.create(seller, body as never)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @CurrentUser("sub") userId: string,
    @Body() body: unknown,
  ) {
    const seller = await this.getSellerProfileId(userId)
    return this.products.update(id, seller, body as Record<string, unknown>)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@Param("id") id: string, @CurrentUser("sub") userId: string) {
    const seller = await this.getSellerProfileId(userId)
    return this.products.softDelete(id, seller)
  }

  private async getSellerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.sellerProfile.findUnique({ where: { userId } })
    if (!profile) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Требуется профиль продавца" })
    }
    return profile.id
  }
}
