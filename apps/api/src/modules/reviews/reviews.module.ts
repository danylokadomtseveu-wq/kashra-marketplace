import { Global, Module } from "@nestjs/common"
import { ReviewsService } from "./reviews.service.js"
import { ReviewsController } from "./reviews.controller.js"

@Global()
@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
