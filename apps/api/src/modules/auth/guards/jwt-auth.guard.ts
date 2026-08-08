import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { FastifyRequest } from "fastify"
import { Reflector } from "@nestjs/core"
import { APP_CONFIG, AppConfig } from "../../../config/app.config.js"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js"
import type { JwtPayload } from "../auth.service.js"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const token = this.extractToken(request)
    if (!token) {
      throw new UnauthorizedException({ code: "MISSING_TOKEN", message: "Access-токен отсутствует" })
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.JWT_ACCESS_SECRET,
      })
      ;(request as FastifyRequest & { user: JwtPayload }).user = payload
      return true
    } catch {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Невалидный access-токен" })
    }
  }

  private extractToken(request: FastifyRequest): string | undefined {
    const header = request.headers["authorization"]
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7)
    }
    return undefined
  }
}
