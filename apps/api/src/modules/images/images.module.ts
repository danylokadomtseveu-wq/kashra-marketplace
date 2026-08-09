import { Module } from "@nestjs/common"
import { ImagesController } from "./images.controller.js"
import { ImagesService } from "./images.service.js"
import { StorageModule } from "../storage/storage.module.js"
import { PrismaModule } from "../prisma/prisma.module.js"

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
