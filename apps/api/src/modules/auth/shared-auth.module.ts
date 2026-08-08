import { Global, Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard.js"

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [OptionalJwtAuthGuard],
  exports: [JwtModule, OptionalJwtAuthGuard],
})
export class SharedAuthModule {}
