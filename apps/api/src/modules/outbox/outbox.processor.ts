import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import type { Redis } from "ioredis"
import { PrismaService } from "../prisma/prisma.service.js"
import { REDIS_CLIENT } from "../redis/redis.module.js"
import { CacheService } from "../cache/cache.service.js"
import { createLogger } from "../../common/logger.js"
import type { AppLogger } from "../../common/logger.js"
import { APP_CONFIG, AppConfig } from "../../config/app.config.js"

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger: AppLogger
  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly cache: CacheService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.logger = createLogger(config.LOG_LEVEL)
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.processBatch().catch((error) => {
        this.logger.error({ error }, "outbox processing failed")
      })
    }, 5000)
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  private async processBatch(): Promise<void> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: "PENDING" },
      take: 50,
      orderBy: { createdAt: "asc" },
    })

    for (const event of events) {
      try {
        await this.handleEvent(event.eventType, event.payload)
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: "DONE", processedAt: new Date() },
        })
      } catch (error) {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: "FAILED", attempts: { increment: 1 } },
        })
        this.logger.error({ eventId: event.id, error }, "outbox event failed")
      }
    }
  }

  private async handleEvent(type: string, payload: unknown): Promise<void> {
    const data = payload as Record<string, string>
    switch (type) {
      case "order.created":
        this.logger.info({ orderId: data.orderId }, "order created event processed")
        break
      case "order.paid":
        this.logger.info({ orderId: data.orderId }, "order paid event processed")
        break
      case "order.completed":
        this.logger.info({ orderId: data.orderId }, "order completed event processed")
        break
      case "order.cancelled":
        this.logger.info({ orderId: data.orderId }, "order cancelled event processed")
        break
    }
  }
}
