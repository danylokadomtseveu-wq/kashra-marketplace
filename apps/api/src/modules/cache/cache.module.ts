import { Global, Module } from "@nestjs/common"
import { CacheService } from "./cache.service.js"
import { RateLimitGuard } from "./guards/rate-limit.guard.js"

@Global()
@Module({
  providers: [CacheService, RateLimitGuard],
  exports: [CacheService, RateLimitGuard],
})
export class CacheModule {}
