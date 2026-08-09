import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { CurrentUser } from "../auth/decorators/current-user.decorator.js"
import { ImagesService } from "./images.service.js"
import { StorageService } from "../storage/storage.service.js"
import type { StoredObject } from "../storage/storage.service.js"

interface AuthRequest extends FastifyRequest {
  user?: { sub: string; role?: string }
}

interface IncomingFile {
  filename: string | null
  mimetype: string
  toBuffer: () => Promise<Buffer>
}

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(
    private readonly images: ImagesService,
    private readonly storage: StorageService,
  ) {}

  @Post(":productId/images")
  async upload(
    @Param("productId") productId: string,
    @CurrentUser("sub") userId: string,
    @Request() request: AuthRequest,
  ) {
    await this.images.assertOwner(productId, userId, request.user?.role)

    const uploads: StoredObject[] = []
    const parts = await (request as unknown as { parts: () => AsyncIterableIterator<unknown> }).parts()
    for await (const part of parts) {
      const f = part as IncomingFile
      if (!f.filename || typeof f.toBuffer !== "function") continue
      const buffer = await f.toBuffer()
      uploads.push(
        await this.storage.upload(
          { buffer, originalname: f.filename, mimetype: f.mimetype ?? "image/jpeg" },
          productId,
        ),
      )
    }

    if (uploads.length === 0) {
      throw new BadRequestException({ code: "NO_FILES", message: "Файлы не получены" })
    }

    await this.images.createImages(productId, uploads)
    return { ok: true, count: uploads.length }
  }

  @Delete(":productId/images/:imageId")
  async remove(
    @Param("productId") productId: string,
    @Param("imageId") imageId: string,
    @CurrentUser("sub") userId: string,
    @Request() request: AuthRequest,
  ) {
    await this.images.assertOwner(productId, userId, request.user?.role)
    return this.images.delete(productId, imageId)
  }
}
