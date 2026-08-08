import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common"
import { SellersService } from "./sellers.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"

@Controller("sellers")
export class SellersController {
  constructor(private readonly sellers: SellersService) {}

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.sellers.getById(id)
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser("sub") userId: string, @Body() body: { name?: string; description?: string }) {
    return this.sellers.upsertMe(userId, body)
  }

  @Get("me/products")
  @UseGuards(JwtAuthGuard)
  getMyProducts(@CurrentUser("sub") userId: string, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.sellers.getMyProducts(userId, { cursor, limit: limit ? Number(limit) : undefined })
  }

  @Get("me/orders")
  @UseGuards(JwtAuthGuard)
  getMyOrders(@CurrentUser("sub") userId: string, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.sellers.getMyOrders(userId, { cursor, limit: limit ? Number(limit) : undefined })
  }

  @Get("me/stats")
  @UseGuards(JwtAuthGuard)
  getStats(@CurrentUser("sub") userId: string) {
    return this.sellers.getStats(userId)
  }
}
