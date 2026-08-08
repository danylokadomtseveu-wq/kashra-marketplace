import "dotenv/config"
import { loadConfig } from "@marketplace/config"
import { pino } from "pino"
import { createWorkers } from "./worker.js"

async function main(): Promise<void> {
  const config = loadConfig(process.env)
  const logger = pino({
    level: config.LOG_LEVEL,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
  })

  const workers = createWorkers({ config, logger })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`received ${signal}, shutting down`)
    await Promise.all(workers.map((worker) => worker.close()))
    process.exit(0)
  }

  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))

  logger.info(`worker started, queues: ${Object.keys(workers).length}`)
}

void main()
