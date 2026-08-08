import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common"
import { UsersService } from "./users.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  getMe(@CurrentUser("sub") userId: string) {
    return this.users.getMe(userId)
  }

  @Patch("me")
  updateMe(@CurrentUser("sub") userId: string, @Body() body: { name?: string }) {
    return this.users.updateMe(userId, body)
  }
}
