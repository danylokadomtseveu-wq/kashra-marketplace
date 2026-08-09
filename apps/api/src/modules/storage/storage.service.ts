import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3"
import { randomUUID } from "node:crypto"
import { extname } from "node:path"

const MAX_BYTES = 10 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
])

export const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"])

export interface StoredObject {
  url: string
  key: string
  size: number
  mimetype: string
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly publicUrl: string
  private ready: Promise<void>

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("S3_BUCKET") ?? "media"
    this.publicUrl = (this.config.get<string>("S3_PUBLIC_URL") ?? "").replace(/\/$/, "")
    this.s3 = new S3Client({
      region: this.config.get<string>("S3_REGION") ?? "us-east-1",
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY") ?? "",
        secretAccessKey: this.config.get<string>("S3_SECRET_KEY") ?? "",
      },
      forcePathStyle: true,
    })
    this.ready = this.init()
  }

  private async init(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch (e: unknown) {
      if (e && typeof e === "object" && "name" in e) {
        const name = (e as { name: string }).name
        if (name === "NotFound" || name === "NotFoundException") {
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }))
          try {
            await this.s3.send(
              new PutBucketPolicyCommand({
                Bucket: this.bucket,
                Policy: JSON.stringify({
                  Version: "2012-10-17",
                  Statement: [
                    {
                      Effect: "Allow",
                      Principal: "*",
                      Action: "s3:GetObject",
                      Resource: `arn:aws:s3:::${this.bucket}/*`,
                    },
                  ],
                }),
              }),
            )
          } catch {
            this.logger.warn(`Bucket ${this.bucket} создан, но публичная политик не применена`)
          }
        }
      } else {
        this.logger.warn(`MinIO unavailable on init: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  validate(file: { size: number; mimetype: string; originalname: string }): void {
    if (!file.size || file.size <= 0) {
      throw new Error("Файл пустой")
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`Файл превышает ${MAX_BYTES / 1024 / 1024} МБ`)
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new Error("Разрешены только изображения (jpeg, png, gif, webp)")
    }
    const ext = extname(file.originalname).replace(".", "").toLowerCase()
    if (!ALLOWED_IMAGE_EXTS.has(ext)) {
      throw new Error("Недопустимое расширение файла")
    }
  }

  async upload(file: { buffer: Buffer; originalname: string; mimetype: string }, productId: string): Promise<StoredObject> {
    await this.ready
    this.validate({ ...file, size: file.buffer.length })

    const safeBase = extname(file.originalname)
      .replace(/^[^a-z0-9.]/i, "")
      .toLowerCase()
    const ext = safeBase ? safeBase.replace(".", "") : "jpg"
    const extOk = ALLOWED_IMAGE_EXTS.has(ext) ? ext : "jpg"
    const key = `products/${productId}/${randomUUID()}/${randomUUID()}.${extOk}`

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      }),
    )

    return {
      url: this.publicUrl ? `${this.publicUrl}/${key}` : `https://${this.bucket}/${key}`,
      key,
      size: file.buffer.length,
      mimetype: file.mimetype,
    }
  }

  async delete(key: string): Promise<void> {
    await this.ready
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
