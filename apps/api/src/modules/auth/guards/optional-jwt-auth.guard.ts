import { ExecutionContext, Injectable, Inject } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { FastifyRequest } from "fastify"
import { APP_CONFIG, AppConfig } from "../../../config/app.config.js"
import type { JwtPayload } from "../auth.service.js"

/**
 * Опциональная аутентификация: если токен валиден — устанавливает request.user,
 * если нет — пропускает без ошибки. Для роутов, доступных и гостям, и юзерам (cart).
 */
@Injectable()
export class OptionalJwtAuthGuard {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const token = this.extractToken(request)
    if (!token) return true

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.JWT_ACCESS_SECRET,
      })
      ;(request as FastifyRequest & { user: JwtPayload }).user = payload
    } catch {
      // Невалидный токен — пропускаем как гостя
    }
    return true
  }

  private extractToken(request: FastifyRequest): string | undefined {
    const header = request.headers["authorization"]
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7)
    }
    return undefined
  }
}
