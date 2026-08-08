export const ERROR_CODES = {
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  STOCK: "INSUFFICIENT_STOCK",
  IDEMPOTENCY: "IDEMPOTENCY_CONFLICT",
  PAYMENT: "PAYMENT_ERROR",
  INTERNAL: "INTERNAL_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiException extends Error {
  readonly statusCode: number
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = "ApiException"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, details: this.details } }
  }
}

export class NotFoundError extends ApiException {
  constructor(message = "Ресурс не найден") {
    super(404, ERROR_CODES.NOT_FOUND, message)
  }
}

export class ConflictError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(409, ERROR_CODES.CONFLICT, message, details)
  }
}

export class UnauthorizedError extends ApiException {
  constructor(message = "Требуется авторизация") {
    super(401, ERROR_CODES.UNAUTHORIZED, message)
  }
}

export class ForbiddenError extends ApiException {
  constructor(message = "Доступ запрещён") {
    super(403, ERROR_CODES.FORBIDDEN, message)
  }
}

export class ValidationApiError extends ApiException {
  constructor(message = "Некорректные данные", details?: unknown) {
    super(422, ERROR_CODES.VALIDATION, message, details)
  }
}

export class RateLimitedError extends ApiException {
  constructor(message = "Слишком много запросов. Попробуйте позже") {
    super(429, ERROR_CODES.RATE_LIMITED, message)
  }
}

export class StockError extends ApiException {
  constructor(message = "Товара недостаточно на складе") {
    super(409, ERROR_CODES.STOCK, message)
  }
}

export class PaymentError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(402, ERROR_CODES.PAYMENT, message, details)
  }
}
