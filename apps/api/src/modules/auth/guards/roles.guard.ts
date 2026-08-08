import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { FastifyRequest } from "fastify"
import { ROLES_KEY } from "../decorators/roles.decorator.js"
import type { JwtPayload } from "../auth.service.js"
import type { Role } from "@prisma/client"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const request = context.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>()
    const role = request.user?.role
    if (!role || !required.includes(role as Role)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Недостаточно прав" })
    }
    return true
  }
}
