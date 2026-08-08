import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import cookie from "@fastify/cookie"
import { loadConfig } from "@marketplace/config"
import { AppModule } from "./app.module.js"
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js"

async function bootstrap(): Promise<void> {
  const config = loadConfig(process.env)

  const adapter = new FastifyAdapter({
    logger: {
      level: config.LOG_LEVEL,
    },
    trustProxy: true,
    bodyLimit: 1_048_576,
  })

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: false,
    bufferLogs: true,
  })

  await app.register(cookie)
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })
  await app.register(cors, {
    origin: config.NODE_ENV === "development" ? true : [/\.yourdomain\.com$/],
    credentials: true,
  })

  app.setGlobalPrefix("api/v1")
  app.useGlobalFilters(new AllExceptionsFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Marketplace API")
    .setDescription("Scalable marketplace REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup("api/docs", app, document)

  await app.listen(config.API_PORT, config.API_HOST)
  const instance = app.getHttpAdapter().getInstance()
  instance.log.info(
    `API listening on http://${config.API_HOST}:${config.API_PORT}/api/v1 (env: ${config.NODE_ENV})`,
  )
}

void bootstrap()
