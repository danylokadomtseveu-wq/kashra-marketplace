import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ReviewsService } from "./reviews.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { Public } from "../auth/decorators/public.decorator.js"
import { reviewSchema } from "@marketplace/validation"

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get("products/:productId/reviews")
  list(@Param("productId") productId: string, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.reviews.listForProduct(productId, { cursor, limit: limit ? Number(limit) : undefined })
  }

  @Post("products/:productId/reviews")
  create(
    @CurrentUser("sub") userId: string,
    @Param("productId") productId: string,
    @Body() body: unknown,
  ) {
    const data = reviewSchema.parse(body as object) as { rating: number; text: string }
    return this.reviews.create(userId, { productId, ...data })
  }

  @Delete(":reviewId")
  delete(@CurrentUser("sub") userId: string, @Param("reviewId") reviewId: string) {
    return this.reviews.delete(userId, reviewId)
  }
}
