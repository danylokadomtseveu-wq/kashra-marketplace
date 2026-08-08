import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import { Reflector } from "@nestjs/core"
import { CacheService } from "../cache.service.js"
import type { RateLimitOptions } from "../decorators/rate-limit.decorator.js"
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator.js"

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!options) return true

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const identifier = this.getIdentifier(request)
    const key = `ratelimit:${options.keyPrefix ?? "global"}:${identifier}`

    const current = await this.cache.increment(key, options.windowSeconds)

    if (current > options.max) {
      const ttl = await this.cache.ttl(key)
      throw new HttpException(
        {
          code: "RATE_LIMITED",
          message: "Слишком много запросов. Попробуйте позже",
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }

  private getIdentifier(request: FastifyRequest): string {
    // Приоритет: авторизованный userId > IP
    const user = (request as FastifyRequest & { user?: { sub: string } }).user
    if (user?.sub) return `user:${user.sub}`
    const ip = request.ip ?? request.socket?.remoteAddress ?? "unknown"
    return `ip:${ip}`
  }
}
