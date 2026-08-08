import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import { CartService } from "./cart.service.js"
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { cartAddSchema, cartUpdateSchema } from "@marketplace/validation"

const GUEST_COOKIE = "__guest__"

@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  get(@Req() req: FastifyRequest, @CurrentUser("sub") userId?: string) {
    const guestId = this.getGuestId(req)
    return this.cart.getCart(userId, guestId)
  }

  @Post("items")
  @UseGuards(OptionalJwtAuthGuard)
  addItem(
    @Req() req: FastifyRequest,
    @CurrentUser("sub") userId: string | undefined,
    @Body() body: unknown,
  ) {
    const data = cartAddSchema.parse(body)
    const guestId = this.getGuestId(req)
    return this.cart.addItem(userId, guestId, data)
  }

  @Patch("items/:itemId")
  @UseGuards(OptionalJwtAuthGuard)
  updateItem(
    @Req() req: FastifyRequest,
    @CurrentUser("sub") userId: string | undefined,
    @Param("itemId") itemId: string,
    @Body() body: unknown,
  ) {
    const data = cartUpdateSchema.parse(body)
    const guestId = this.getGuestId(req)
    return this.cart.updateItemQty(userId, guestId, itemId, data.qty)
  }

  @Delete("items/:itemId")
  @UseGuards(OptionalJwtAuthGuard)
  removeItem(
    @Req() req: FastifyRequest,
    @CurrentUser("sub") userId: string | undefined,
    @Param("itemId") itemId: string,
  ) {
    const guestId = this.getGuestId(req)
    return this.cart.removeItem(userId, guestId, itemId)
  }

  @Post("merge")
  @UseGuards(JwtAuthGuard)
  merge(@CurrentUser("sub") userId: string, @Req() req: FastifyRequest) {
    const guestId = this.getGuestId(req)
    if (!guestId) return this.cart.getCart(userId, undefined)
    return this.cart.mergeGuestCart(guestId, userId)
  }

  private getGuestId(req: FastifyRequest): string | undefined {
    return req.cookies?.[GUEST_COOKIE]
  }
}
