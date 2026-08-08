import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import type { JwtPayload } from "../auth.service.js"

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>()
    const user = request.user
    return data ? user?.[data] : user
  },
)
