import { Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { NotificationsService } from "./notifications.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser("sub") userId: string, @Query("unread") unread?: string) {
    return this.notifications.listForUser(userId, unread === "true")
  }

  @Get("unread-count")
  unreadCount(@CurrentUser("sub") userId: string) {
    return this.notifications.getUnreadCount(userId)
  }

  @Patch(":id/read")
  markAsRead(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.notifications.markAsRead(userId, id)
  }

  @Post("read-all")
  markAllAsRead(@CurrentUser("sub") userId: string) {
    return this.notifications.markAllAsRead(userId)
  }
}
