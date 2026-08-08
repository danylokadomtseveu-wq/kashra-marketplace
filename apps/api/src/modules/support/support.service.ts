import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"

export interface CreateTicketDto {
  subject: string
  message: string
  orderId?: string
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  // В MVP тикеты храним как Notification с типом SUPPORT
  // В полной версии — отдельная таблица Ticket/Message

  async createTicket(userId: string, data: CreateTicketDto) {
    if (!data.subject || !data.message) {
      throw new BadRequestException({ code: "INVALID_DATA", message: "Заполните тему и сообщение" })
    }

    return this.prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        payload: {
          ticket: true,
          subject: data.subject,
          message: data.message,
          orderId: data.orderId ?? null,
          status: "OPEN",
        },
      },
    })
  }

  async listTickets(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, type: "SYSTEM" },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return notifications.filter((n) => {
      const payload = n.payload as Record<string, unknown> | null
      return payload?.["ticket"] === true
    })
  }

  async getTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.notification.findFirst({
      where: { id: ticketId, userId, type: "SYSTEM" },
    })
    if (!ticket) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Тикет не найден" })
    }
    return ticket
  }

  async replyToTicket(userId: string, ticketId: string, message: string) {
    const ticket = await this.getTicket(userId, ticketId)
    const payload = ticket.payload as Record<string, unknown> | null
    if (!payload) throw new NotFoundException({ code: "NOT_FOUND", message: "Тикет не найден" })

    return this.prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        payload: {
          ticket: true,
          parentTicketId: ticketId,
          subject: `Re: ${payload["subject"] ?? ""}`,
          message,
          status: "REPLY",
        },
      },
    })
  }
}
