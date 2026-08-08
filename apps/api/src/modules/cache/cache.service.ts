import { Inject, Injectable } from "@nestjs/common"
import type { Redis } from "ioredis"
import { REDIS_CLIENT } from "../redis/redis.module.js"
import { APP_CONFIG, AppConfig } from "../../config/app.config.js"
import { createLogger } from "../../common/logger.js"
import type { AppLogger } from "../../common/logger.js"

@Injectable()
export class CacheService {
  private readonly logger: AppLogger

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.logger = createLogger(config.LOG_LEVEL)
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value)
    await this.redis.set(key, payload, "EX", ttlSeconds)
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  /**
   * Cache-aside с stampede protection через временный lock.
   * Если кэш пуст — единственный запрос получает lock и вычисляет значение,
   * остальные ждут короткое время и пробуют снова.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
    opts: { lockTtl?: number; waitForLockMs?: number } = {},
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const lockKey = `lock:${key}`
    const lockTtl = opts.lockTtl ?? 10
    const waitForLockMs = opts.waitForLockMs ?? 500

    const acquired = await this.redis.set(lockKey, "1", "EX", lockTtl, "NX")
    if (acquired === "OK") {
      try {
        const value = await factory()
        await this.set(key, value, withJitter(ttlSeconds))
        return value
      } finally {
        await this.redis.del(lockKey)
      }
    }

    // Другой процесс вычисляет — подождём и прочитаем из кэша
    await sleep(waitForLockMs)
    const retry = await this.get<T>(key)
    if (retry !== null) return retry
    return factory()
  }

  async increment(key: string, windowSeconds: number): Promise<number> {
    const multi = this.redis.multi()
    multi.incr(key)
    multi.expire(key, windowSeconds)
    const results = await multi.exec()
    return (results?.[0]?.[1] as number) ?? 1
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key)
  }
}

function withJitter(ttlSeconds: number): number {
  // ±10% jitter для предотвращения одновременного протухания ключей
  const jitter = Math.floor(ttlSeconds * 0.1)
  return ttlSeconds + Math.floor(Math.random() * jitter * 2) - jitter
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
