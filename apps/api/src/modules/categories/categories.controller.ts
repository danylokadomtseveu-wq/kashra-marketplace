import { Controller, Get, Param } from "@nestjs/common"
import { CategoriesService } from "./categories.service.js"

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findMany() {
    return this.categories.findMany()
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.categories.findBySlug(slug)
  }
}
