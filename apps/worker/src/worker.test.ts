import { describe, expect, it, vi } from "vitest"
import type { AppConfig } from "@marketplace/config"
import type { Logger } from "pino"
import { QUEUES, dispatchJob } from "./worker.js"

function makeCtx() {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger
  const config = {
    LOG_LEVEL: "info",
    WORKER_CONCURRENCY: 2,
  } as unknown as AppConfig
  return { logger, config }
}

describe("dispatchJob", () => {
  it("вызывает хендлер для известной очереди", async () => {
    const ctx = makeCtx()
    await dispatchJob(QUEUES["order-events"], { orderId: 42 }, ctx)
    expect(ctx.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ jobData: expect.objectContaining({ orderId: 42 }) }),
      "order event job",
    )
  })

  it("логирует warning для неизвестной очереди", async () => {
    const ctx = makeCtx()
    await dispatchJob("unknown-queue", {}, ctx)
    expect(ctx.logger.warn).toHaveBeenCalledTimes(1)
    expect(ctx.logger.warn).toHaveBeenCalledWith(
      { jobName: "unknown-queue" },
      "no handler for job",
    )
  })

  it("содержит все ожидаемые очереди", () => {
    expect(Object.values(QUEUES)).toEqual(
      expect.arrayContaining([
        "emails",
        "notifications",
        "payments",
        "inventory",
        "search-indexing",
        "analytics",
        "order-events",
      ]),
    )
  })
})
