import { Controller, Get } from "@nestjs/common"
import { BrandsService } from "./brands.service.js"

@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  findMany() {
    return this.brands.findMany()
  }
}
