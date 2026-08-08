import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { OrdersService } from "./orders.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { checkoutSchema } from "@marketplace/validation"

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const data = checkoutSchema.parse(body)
    return this.orders.create(userId, data)
  }

  @Get()
  list(@CurrentUser("sub") userId: string) {
    return this.orders.listByUser(userId)
  }

  @Get(":id")
  getById(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.orders.getById(userId, id)
  }

  @Post(":id/pay")
  pay(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.orders.payOrder(userId, id)
  }

  @Post(":id/confirm")
  confirm(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.orders.confirmReceived(userId, id)
  }

  @Post(":id/cancel")
  cancel(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.orders.cancel(userId, id)
  }
}
