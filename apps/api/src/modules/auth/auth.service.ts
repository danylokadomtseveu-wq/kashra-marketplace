import { Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService, JwtSignOptions } from "@nestjs/jwt"
import { hash, compare } from "bcryptjs"
import type { Redis } from "ioredis"
import { PrismaService } from "../prisma/prisma.service.js"
import { REDIS_CLIENT } from "../redis/redis.module.js"
import { APP_CONFIG, AppConfig } from "../../config/app.config.js"
import { createLogger } from "../../common/logger.js"
import type { AppLogger } from "../../common/logger.js"
import { loginSchema, registerSchema } from "@marketplace/validation"
import type { LoginInput, RegisterInput } from "@marketplace/validation"

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  private readonly logger: AppLogger

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.logger = createLogger(config.LOG_LEVEL)
  }

  async register(input: RegisterInput): Promise<{ userId: string }> {
    const data = registerSchema.parse(input)
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      throw new UnauthorizedException({ code: "CONFLICT", message: "Email уже зарегистрирован" })
    }

    const passwordHash = await hash(data.password, 10)
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    })

    this.logger.info({ userId: user.id }, "user registered")
    return { userId: user.id }
  }

  async login(input: LoginInput): Promise<TokenPair> {
    const data = loginSchema.parse(input)
    const user = await this.prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Неверный email или пароль" })
    }

    const ok = await compare(data.password, user.passwordHash)
    if (!ok) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Неверный email или пароль" })
    }

    return this.generatePair(user.id, user.email, user.role)
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.JWT_REFRESH_SECRET,
      })
    } catch {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Невалидный refresh-токен" })
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`)
    if (stored !== refreshToken) {
      // Reuse detection: если refresh-токен не совпадает с хранимым — инвалидируем всю сессию
      await this.redis.del(`refresh:${payload.sub}`)
      this.logger.warn({ userId: payload.sub }, "refresh token reuse detected")
      throw new UnauthorizedException({ code: "TOKEN_REUSE", message: "Сессия инвалидирована" })
    }

    await this.redis.del(`refresh:${payload.sub}`)
    return this.generatePair(payload.sub, payload.email, payload.role)
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`)
  }

  private async generatePair(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role }
    const accessOptions: JwtSignOptions = {
      secret: this.config.JWT_ACCESS_SECRET,
      expiresIn: this.config.JWT_ACCESS_TTL as never,
    }
    const accessToken = await this.jwt.signAsync(payload, accessOptions)
    const refreshOptions: JwtSignOptions = {
      secret: this.config.JWT_REFRESH_SECRET,
      expiresIn: this.config.JWT_REFRESH_TTL as never,
    }
    const refreshToken = await this.jwt.signAsync(payload, refreshOptions)

    const ttl = parseDurationSeconds(this.config.JWT_REFRESH_TTL)
    await this.redis.set(`refresh:${userId}`, refreshToken, "EX", ttl)

    return { accessToken, refreshToken }
  }
}

function parseDurationSeconds(input: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(input.trim())
  if (!match) return 2592000
  const value = Number(match[1])
  const unit = (match[2] ?? "s").toLowerCase()
  switch (unit) {
    case "m":
      return value * 60
    case "h":
      return value * 3600
    case "d":
      return value * 86400
    default:
      return value
  }
}
