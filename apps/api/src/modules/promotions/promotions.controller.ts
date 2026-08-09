import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js"
import { PromotionsService } from "./promotions.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { Public } from "../auth/decorators/public.decorator.js"
import { couponValidateContextSchema } from "@marketplace/validation"

@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Public()
  @Get("promotions")
  findActive() {
    return this.promotions.findActive()
  }

  @Post("coupons/validate")
  @UseGuards(JwtAuthGuard)
  validateCoupon(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(couponValidateContextSchema))
    body: { code: string; cartTotal?: number; itemIds?: string[] },
  ) {
    return this.promotions.validateCoupon(userId, body.code, {
      cartTotal: body.cartTotal,
      itemProductIds: body.itemIds,
    })
  }
}
