import { pino } from "pino"

export function createLogger(level: string) {
  return pino({
    level,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
          }
        : undefined,
  })
}

export type AppLogger = ReturnType<typeof createLogger>
