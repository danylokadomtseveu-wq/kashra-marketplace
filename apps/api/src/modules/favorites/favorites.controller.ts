import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common"
import { FavoritesService } from "./favorites.service.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser("sub") userId: string) {
    return this.favorites.listForUser(userId)
  }

  @Post(":productId")
  add(@CurrentUser("sub") userId: string, @Param("productId") productId: string) {
    return this.favorites.add(userId, productId)
  }

  @Delete(":productId")
  remove(@CurrentUser("sub") userId: string, @Param("productId") productId: string) {
    return this.favorites.remove(userId, productId)
  }
}
