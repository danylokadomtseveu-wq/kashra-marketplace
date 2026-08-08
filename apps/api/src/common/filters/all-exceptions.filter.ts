import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common"
import type { FastifyReply, FastifyRequest } from "fastify"
import { ApiException } from "../errors/api-error.js"

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions")

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const requestId = request.id
    const path = request.url
    const method = request.method

    if (exception instanceof ApiException) {
      reply.status(exception.statusCode).send(exception.toBody())
      if (exception.statusCode >= 500) {
        this.logger.error(`${method} ${path} [${requestId}] -> ${exception.message}`)
      }
      return
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()
      const body =
        typeof response === "string"
          ? { error: { code: "HTTP_ERROR", message: response } }
          : { error: { code: "HTTP_ERROR", message: "Ошибка запроса", ...(response as object) } }
      reply.status(status).send(body)
      if (status >= 500) {
        this.logger.error(`${method} ${path} [${requestId}] -> ${exception.message}`)
      }
      return
    }

    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception ${method} ${path} [${requestId}]: ${exception.message}\n${exception.stack ?? ""}`,
      )
    } else {
      this.logger.error(`Unhandled exception ${method} ${path} [${requestId}]: ${String(exception)}`)
    }

    const body = { error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" } }
    reply.status(500).send(body)
  }
}
