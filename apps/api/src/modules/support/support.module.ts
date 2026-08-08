import { Global, Module } from "@nestjs/common"
import { SupportService } from "./support.service.js"
import { SupportController } from "./support.controller.js"

@Global()
@Module({
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
