import { describe, it, expect, vi, beforeEach } from "vitest"
import { StorageService, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTS } from "./storage.service.js"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import type { ConfigService } from "@nestjs/config"

vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...(await importOriginal()),
  S3Client: class {
    send = vi.fn()
  },
}))

function makeConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    S3_BUCKET: "media",
    S3_PUBLIC_URL: "http://localhost:9000/media",
    S3_REGION: "us-east-1",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "minioadmin",
    S3_SECRET_KEY: "minioadmin",
    ...overrides,
  }
  return { get: (key: string) => values[key] } as unknown as ConfigService
}

function buffer(len = 16): Buffer {
  return Buffer.alloc(len, 0)
}

describe("StorageService", () => {
  let service: StorageService
  let mockS3: { send: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    service = new StorageService(makeConfig())
    mockS3 = service["s3"] as unknown as { send: ReturnType<typeof vi.fn> }
    mockS3.send.mockReset()
    mockS3.send.mockResolvedValue({})
    service["ready"] = Promise.resolve()
  })

  describe("constants", () => {
    it("разрешает нужные MIME и расширения", () => {
      expect(ALLOWED_IMAGE_TYPES.has("image/webp")).toBe(true)
      expect(ALLOWED_IMAGE_TYPES.has("image/svg+xml")).toBe(false)
      expect(ALLOWED_IMAGE_EXTS.has("webp")).toBe(true)
      expect(ALLOWED_IMAGE_EXTS.has("svg")).toBe(false)
    })
  })

  describe("validate", () => {
    it("пропускает валидный файл", () => {
      expect(() => service.validate({ size: 100, mimetype: "image/jpeg", originalname: "a.jpg" })).not.toThrow()
    })

    it("отклоняет пустой файл", () => {
      expect(() => service.validate({ size: 0, mimetype: "image/png", originalname: "a.png" })).toThrow(/пустой/)
    })

    it("отклоняет файл больше 10 МБ", () => {
      expect(() => service.validate({ size: 11 * 1024 * 1024, mimetype: "image/png", originalname: "a.png" })).toThrow(
        /превышает/,
      )
    })

    it("отклоняет недопустимый MIME", () => {
      expect(() => service.validate({ size: 10, mimetype: "application/pdf", originalname: "a.pdf" })).toThrow(
        /изображения/,
      )
    })

    it("отклоняет недопустимое расширение", () => {
      expect(() => service.validate({ size: 10, mimetype: "image/png", originalname: "a.svg" })).toThrow(
        /расширение/,
      )
    })
  })

  describe("upload", () => {
    it("загружает файл и возвращает url/key/size/mimetype", async () => {
      const file = { buffer: buffer(100), mimetype: "image/png", originalname: "photo.png" }

      const result = await service.upload(file, "p-1")

      expect(mockS3.send).toHaveBeenCalledTimes(1)
      const cmd = mockS3.send.mock.calls[0]?.[0] as unknown as PutObjectCommand
      expect(cmd).toBeInstanceOf(PutObjectCommand)
      expect((cmd as unknown as { input: Record<string, unknown> }).input).toMatchObject({
        Bucket: "media",
        Key: expect.stringMatching(/^products\/p-1\/.*\/.*\.png$/),
        Body: file.buffer,
        ContentType: "image/png",
        ACL: "public-read",
      })
      expect(result).toMatchObject({
        key: expect.stringMatching(/^products\/p-1\/.*\/.*\.png$/),
        url: expect.stringContaining("http://localhost:9000/media/"),
        size: 100,
        mimetype: "image/png",
      })
    })

    it("отклоняет файл, не проходящий валидацию", async () => {
      mockS3.send.mockClear()
      await expect(
        service.upload({ buffer: buffer(100), mimetype: "image/png", originalname: "evil.exe" }, "p-1"),
      ).rejects.toThrow(/расширение/)
      expect(mockS3.send).not.toHaveBeenCalled()
    })

    it("отклоняет файл без расширения в имени", async () => {
      await expect(
        service.upload({ buffer: buffer(10), mimetype: "image/jpeg", originalname: "noext" }, "p-2"),
      ).rejects.toThrow(/расширение/)
      expect(mockS3.send).not.toHaveBeenCalled()
    })

    it("подставит https-url, если S3_PUBLIC_URL пустой", async () => {
      const s = new StorageService(makeConfig({ S3_PUBLIC_URL: "" }))
      s["ready"] = Promise.resolve()
      const result = await s.upload({ buffer: buffer(10), mimetype: "image/png", originalname: "x.png" }, "p-3")
      expect(result.url).toMatch(/^https:\/\/media\//)
    })
  })
})
