import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req, Res, UnauthorizedException } from "@nestjs/common"
import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthService } from "./auth.service.js"
import { loginSchema, registerSchema } from "@marketplace/validation"
import { APP_CONFIG } from "../../config/app.config.js"
import type { AppConfig } from "@marketplace/config"
import { Public } from "./decorators/public.decorator.js"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js"
import { RateLimit } from "../cache/decorators/rate-limit.decorator.js"

const REFRESH_COOKIE = "__refresh__"
const REFRESH_MAX_AGE = 30 * 86400

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

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
  async login(@Body(new ZodValidationPipe(loginSchema)) body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const pair = await this.auth.login(body as never)
    this.setRefreshCookie(reply, pair.refreshToken)
    return { accessToken: pair.accessToken, tokenType: "Bearer" }
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 30, windowSeconds: 60, keyPrefix: "auth" })
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = this.extractRefreshToken(req)
    if (!token) {
      throw new UnauthorizedException({ code: "MISSING_TOKEN", message: "Refresh-токен отсутствует" })
    }
    const pair = await this.auth.refresh(token)
    this.setRefreshCookie(reply, pair.refreshToken)
    return { accessToken: pair.accessToken, tokenType: "Bearer" }
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = this.extractRefreshToken(req)
    if (token) {
      await this.auth.logoutToken(token).catch(() => undefined)
    }
    this.clearRefreshCookie(reply)
  }

  @Public()
  @Post("check")
  @HttpCode(HttpStatus.OK)
  async check(@Req() req: FastifyRequest) {
    const token = this.extractRefreshToken(req)
    if (!token) return { authenticated: false }
    try {
      await this.auth.refresh(token)
      return { authenticated: true }
    } catch {
      return { authenticated: false }
    }
  }

  private setRefreshCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.COOKIE_SECURE,
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: REFRESH_MAX_AGE,
    })
  }

  private clearRefreshCookie(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.COOKIE_SECURE,
      sameSite: "strict",
      path: "/api/v1/auth",
    })
  }

  private extractRefreshToken(req: FastifyRequest): string | undefined {
    return req.cookies?.[REFRESH_COOKIE]
  }
}