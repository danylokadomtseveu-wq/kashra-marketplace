import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { AdminService } from "./admin.service.js"
import { RolesGuard } from "../auth/guards/roles.guard.js"
import { Roles } from "../auth/decorators/roles.decorator.js"

@Controller("admin")
@Roles("ADMIN")
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  getStats() {
    return this.admin.getStats()
  }

  @Get("users")
  listUsers(@Query("cursor") cursor?: string, @Query("limit") limit?: string, @Query("search") search?: string) {
    return this.admin.listUsers({ cursor, limit: limit ? Number(limit) : undefined, search })
  }

  @Patch("users/:userId/status")
  updateUserStatus(@Param("userId") userId: string, @Body() body: { status: "ACTIVE" | "BANNED" }) {
    return this.admin.updateUserStatus(userId, body.status)
  }

  @Get("products")
  listProducts(@Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.admin.listProducts({ cursor, limit: limit ? Number(limit) : undefined })
  }

  @Patch("products/:productId/moderate")
  moderateListing(@Param("productId") productId: string, @Body() body: { action: "approve" | "hide" }) {
    return this.admin.moderateListing(productId, body.action)
  }

  @Get("reviews/pending")
  pendingReviews(@Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.admin.listPendingReviews({ cursor, limit: limit ? Number(limit) : undefined })
  }

  @Patch("reviews/:reviewId/moderate")
  moderateReview(@Param("reviewId") reviewId: string, @Body() body: { action: "approve" | "delete" }) {
    return this.admin.moderateReview(reviewId, body.action)
  }

  @Get("disputes")
  listDisputes(@Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.admin.listDisputes({ cursor, limit: limit ? Number(limit) : undefined })
  }

  @Post("disputes/:orderId/resolve")
  resolveDispute(@Param("orderId") orderId: string, @Body() body: { resolution: "refund" | "complete" }) {
    return this.admin.resolveDispute(orderId, body.resolution)
  }
}
