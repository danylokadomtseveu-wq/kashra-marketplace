import { Global, Module, Provider } from "@nestjs/common"
import { Redis } from "ioredis"
import { APP_CONFIG, AppConfig } from "../../config/app.config.js"

export const REDIS_CLIENT = Symbol("REDIS_CLIENT")

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (config: AppConfig): Redis => {
    return new Redis(config.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      keyPrefix: config.REDIS_PREFIX,
    })
  },
  inject: [APP_CONFIG],
}

@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
