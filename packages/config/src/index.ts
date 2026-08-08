import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1),
  DATABASE_URL_REPLICA: z.string().optional(),

  REDIS_URL: z.string().min(1),
  REDIS_PREFIX: z.string().default("mkpl:"),

  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  API_PUBLIC_URL: z.string().default("http://localhost:4000/api/v1"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("900s"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(600),
  RATE_LIMIT_GLOBAL_WINDOW: z.string().default("60s"),

  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("media"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_PUBLIC_URL: z.string().default("http://localhost:9000/media"),

  WEB_PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_API_URL: z.string().default("http://localhost:4000/api/v1"),

  WORKER_CONCURRENCY: z.coerce.number().default(10),
})

export type AppConfig = z.infer<typeof envSchema>

export class ConfigError extends Error {
  constructor(issues: z.ZodIssue[]) {
    super(`Invalid environment configuration:\n${issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`)
    this.name = "ConfigError"
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues)
  }
  return parsed.data
}
