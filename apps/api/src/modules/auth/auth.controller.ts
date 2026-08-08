import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common"
import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthService } from "./auth.service.js"
import { loginSchema, registerSchema } from "@marketplace/validation"
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js"
import { Public } from "./decorators/public.decorator.js"
import { CurrentUser } from "./decorators/current-user.decorator.js"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js"
import { RateLimit } from "../cache/decorators/rate-limit.decorator.js"

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 5, windowSeconds: 60, keyPrefix: "auth" })
  register(@Body(new ZodValidationPipe(registerSchema)) body: unknown) {
    return this.auth.register(body as never)
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 5, windowSeconds: 60, keyPrefix: "auth" })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const pair = await this.auth.login(body as never)
    this.setRefreshCookie(reply, pair.refreshToken)
    return { accessToken: pair.accessToken, tokenType: "Bearer" }
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: FastifyRequest) {
    const token = this.extractRefreshToken(req)
    if (!token) {
      throw new UnauthorizedException({ code: "MISSING_TOKEN", message: "Refresh-токен отсутствует" })
    }
    return this.auth.refresh(token)
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser("sub") userId: string) {
    await this.auth.logout(userId)
  }

  private setRefreshCookie(reply: FastifyReply, token: string): void {
    reply.setCookie("__refresh__", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: 30 * 86400,
    })
  }

  private extractRefreshToken(req: FastifyRequest): string | undefined {
    return req.cookies?.["__refresh__"]
  }
}
