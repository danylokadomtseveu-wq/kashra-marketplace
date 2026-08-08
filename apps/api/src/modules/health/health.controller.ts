import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { HealthService, HealthStatus } from "./health.service.js"
import { Public } from "../auth/decorators/public.decorator.js"

@ApiTags("health")
@Controller()
@Public()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("health")
  status(): Promise<HealthStatus> {
    return this.health.ready()
  }

  @Get("health/live")
  live(): Promise<HealthStatus> {
    return this.health.live()
  }

  @Get("health/ready")
  async ready(): Promise<HealthStatus> {
    const status = await this.health.ready()
    if (status.status !== "ok") {
      throw new ServiceUnavailableException(status)
    }
    return status
  }
}
