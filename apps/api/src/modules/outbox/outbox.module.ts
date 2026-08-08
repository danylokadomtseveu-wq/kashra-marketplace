import { Global, Module } from "@nestjs/common"
import { OutboxProcessor } from "./outbox.processor.js"

@Global()
@Module({
  providers: [OutboxProcessor],
})
export class OutboxModule {}
