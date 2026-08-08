import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common"
import { Redis } from "ioredis"
import { REDIS_CLIENT } from "../redis/redis.module.js"
import { APP_CONFIG, AppConfig } from "../../config/app.config.js"
import { AppLogger, createLogger } from "../../common/logger.js"

export interface HealthStatus {
  status: "ok" | "degraded"
  checks: Record<string, { status: "ok" | "fail"; latencyMs?: number; message?: string }>
}

export interface HealthCheck {
  name: string
  check: () => Promise<void>
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly checks: HealthCheck[] = []
  private readonly logger: AppLogger

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.logger = createLogger(config.LOG_LEVEL)
    this.register("redis", async () => {
      const latencyMs = await Promise.race([
        this.redis.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout")), 3000),
        ),
      ])
      if (latencyMs !== "PONG") {
        throw new Error("Redis ping failed")
      }
    })
  }

  register(name: string, check: () => Promise<void>): void {
    this.checks.push({ name, check })
  }

  async live(): Promise<HealthStatus> {
    return { status: "ok", checks: {} }
  }

  async ready(): Promise<HealthStatus> {
    const checks: HealthStatus["checks"] = {}
    let overall: HealthStatus["status"] = "ok"

    await Promise.all(
      this.checks.map(async ({ name, check }) => {
        const startedAt = Date.now()
        try {
          await check()
          checks[name] = { status: "ok", latencyMs: Date.now() - startedAt }
        } catch (error) {
          overall = "degraded"
          checks[name] = {
            status: "fail",
            latencyMs: Date.now() - startedAt,
            message: error instanceof Error ? error.message : String(error),
          }
          this.logger.error(`health check failed: ${name}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }),
    )

    return { status: overall, checks }
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect()
  }
}
