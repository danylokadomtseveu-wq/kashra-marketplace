import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { SupportService } from "./support.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"

@Controller("support")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get("tickets")
  listTickets(@CurrentUser("sub") userId: string) {
    return this.support.listTickets(userId)
  }

  @Post("tickets")
  createTicket(@CurrentUser("sub") userId: string, @Body() body: { subject: string; message: string; orderId?: string }) {
    return this.support.createTicket(userId, body)
  }

  @Get("tickets/:ticketId")
  getTicket(@CurrentUser("sub") userId: string, @Param("ticketId") ticketId: string) {
    return this.support.getTicket(userId, ticketId)
  }

  @Post("tickets/:ticketId/reply")
  reply(
    @CurrentUser("sub") userId: string,
    @Param("ticketId") ticketId: string,
    @Body() body: { message: string },
  ) {
    return this.support.replyToTicket(userId, ticketId, body.message)
  }
}
