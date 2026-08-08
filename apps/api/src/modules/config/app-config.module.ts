import { Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { loadConfig } from "@marketplace/config"
import { APP_CONFIG } from "../../config/app.config.js"

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
  ],
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadConfig(process.env),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
