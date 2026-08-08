import { Worker, Queue } from "bullmq"
import { Redis } from "ioredis"
import type { AppConfig } from "@marketplace/config"
import type { Logger } from "pino"

export const QUEUES = {
  emails: "emails",
  notifications: "notifications",
  payments: "payments",
  inventory: "inventory",
  "search-indexing": "search-indexing",
  analytics: "analytics",
  "order-events": "order-events",
} as const

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]

export interface WorkerContext {
  config: AppConfig
  logger: Logger
}

const HANDLERS: Partial<Record<QueueName, (jobData: unknown, ctx: WorkerContext) => Promise<void>>> = {
  emails: async (_jobData, ctx) => {
    // PHASE 10: SMTP-адаптер (в dev — лог).
    ctx.logger.info("email job placeholder")
  },
  notifications: async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "notification job")
  },
  payments: async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "payment job")
  },
  inventory: async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "inventory job")
  },
  "search-indexing": async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "search indexing job")
  },
  analytics: async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "analytics job")
  },
  "order-events": async (jobData, ctx) => {
    ctx.logger.info({ jobData }, "order event job")
  },
}

export async function dispatchJob(jobName: string, jobData: unknown, ctx: WorkerContext): Promise<void> {
  const handler = HANDLERS[jobName as QueueName]
  if (!handler) {
    ctx.logger.warn({ jobName }, "no handler for job")
    return
  }
  await handler(jobData, ctx)
}

export function createWorkers(ctx: WorkerContext): Worker[] {
  const connection = new Redis(ctx.config.REDIS_URL, {
    maxRetriesPerRequest: null,
  })

  const workers = Object.keys(QUEUES).map((name) => {
    const worker = new Worker(
      name,
      async (job) => {
        await dispatchJob(job.name, job.data, ctx)
      },
      {
        connection,
        concurrency: ctx.config.WORKER_CONCURRENCY,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    )

    worker.on("failed", (job, failedReason) => {
      ctx.logger.error({ jobId: job?.id, failedReason }, "job failed")
    })

    return worker
  })

  return workers
}

export function createQueue(queueName: QueueName, connection: Redis): Queue {
  return new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  })
}
