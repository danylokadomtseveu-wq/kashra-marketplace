import { Controller, Get, Query } from "@nestjs/common"
import { SearchService } from "./search.service.js"
import { RateLimit } from "../cache/decorators/rate-limit.decorator.js"

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RateLimit({ max: 30, windowSeconds: 60, keyPrefix: "search" })
  searchProducts(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("brandId") brandId?: string,
    @Query("sellerId") sellerId?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("inStock") inStock?: string,
    @Query("sort") sort?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.searchService.search({
      q: q ?? "",
      categoryId,
      brandId,
      sellerId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock === "true",
      sort: sort as never,
      cursor,
      limit: limit ? Number(limit) : 20,
    })
  }
}
