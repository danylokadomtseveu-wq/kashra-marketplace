import { beforeEach, describe, expect, it, vi } from "vitest"
import { hash } from "bcryptjs"
import type { Redis } from "ioredis"
import type { JwtService } from "@nestjs/jwt"
import { AuthService } from "./auth.service.js"
import type { PrismaService } from "../prisma/prisma.service.js"
import type { AppConfig } from "../../config/app.config.js"

function makeConfig(): AppConfig {
  return {
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgresql://localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    REDIS_PREFIX: "test:",
    API_PORT: 4000,
    API_HOST: "0.0.0.0",
    API_PUBLIC_URL: "http://localhost:4000/api/v1",
    JWT_ACCESS_SECRET: "test_access_secret_1234567890",
    JWT_REFRESH_SECRET: "test_refresh_secret_1234567890",
    JWT_ACCESS_TTL: "900s",
    JWT_REFRESH_TTL: "30d",
    COOKIE_SECURE: false,
    RATE_LIMIT_GLOBAL_MAX: 600,
    RATE_LIMIT_GLOBAL_WINDOW: "60s",
    S3_ENDPOINT: "http://localhost:9000",
    S3_REGION: "us-east-1",
    S3_BUCKET: "media",
    S3_ACCESS_KEY: "minioadmin",
    S3_SECRET_KEY: "minioadmin",
    S3_PUBLIC_URL: "http://localhost:9000/media",
    WEB_PORT: 3000,
    NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1",
    WORKER_CONCURRENCY: 10,
  } as unknown as AppConfig
}

describe("AuthService", () => {
  let service: AuthService
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> } }
  let jwt: { signAsync: ReturnType<typeof vi.fn>; verifyAsync: ReturnType<typeof vi.fn> }
  let redis: { set: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    }
    jwt = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    }
    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    }
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      redis as unknown as Redis,
      makeConfig(),
    )
  })

  describe("register", () => {
    it("создаёт пользователя с хешированным паролем", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({ id: "u-1", email: "a@b.co", role: "USER" })

      const result = await service.register({ email: "a@b.co", password: "secret123", name: "Test" })

      expect(result.userId).toBe("u-1")
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: "a@b.co", name: "Test" }),
      })
      const createArg = prisma.user.create.mock.calls[0]?.[0]
      expect(createArg?.data.passwordHash.startsWith("$2b$")).toBe(true)
    })

    it("отклоняет дубликат email", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u-1", email: "a@b.co" })

      await expect(service.register({ email: "a@b.co", password: "secret123", name: "Test" })).rejects.toThrow(
        /уже зарегистрирован/,
      )
    })
  })

  describe("login", () => {
    it("возвращает пару токенов при верных учётных данных", async () => {
      const passwordHash = await hash("secret123", 10)
      prisma.user.findUnique.mockResolvedValue({
        id: "u-1",
        email: "a@b.co",
        passwordHash,
        role: "USER",
      })
      jwt.signAsync.mockResolvedValue("signed-token")

      const result = await service.login({ email: "a@b.co", password: "secret123" })

      expect(result.accessToken).toBe("signed-token")
      expect(result.refreshToken).toBe("signed-token")
      expect(redis.set).toHaveBeenCalledWith("refresh:u-1", "signed-token", "EX", expect.any(Number))
    })

    it("отклоняет неверный пароль", async () => {
      const passwordHash = await hash("otherpassword", 10)
      prisma.user.findUnique.mockResolvedValue({
        id: "u-1",
        email: "a@b.co",
        passwordHash,
        role: "USER",
      })

      await expect(service.login({ email: "a@b.co", password: "secret123" })).rejects.toThrow(/Неверный email/)
    })
  })

  describe("refresh", () => {
    it("обновляет токены при валидном refresh-токене", async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: "u-1", email: "a@b.co", role: "USER" })
      redis.get.mockResolvedValue("old-refresh-token")
      jwt.signAsync.mockResolvedValue("new-token")

      const result = await service.refresh("old-refresh-token")

      expect(result.accessToken).toBe("new-token")
      expect(redis.del).toHaveBeenCalledWith("refresh:u-1")
    })

    it("отклоняет при reuse detection", async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: "u-1", email: "a@b.co", role: "USER" })
      redis.get.mockResolvedValue("different-token")

      await expect(service.refresh("old-refresh-token")).rejects.toThrow(/инвалидирована/)
      expect(redis.del).toHaveBeenCalledWith("refresh:u-1")
    })
  })

  describe("logout", () => {
    it("удаляет refresh-токен из Redis", async () => {
      await service.logout("u-1")
      expect(redis.del).toHaveBeenCalledWith("refresh:u-1")
    })
  })
})
