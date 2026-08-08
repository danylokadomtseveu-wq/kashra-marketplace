import { describe, expect, it } from "vitest"
import {
  ConflictError,
  ERROR_CODES,
  NotFoundError,
  RateLimitedError,
  StockError,
  UnauthorizedError,
  ValidationApiError,
} from "./api-error.js"

describe("ApiException и подклассы", () => {
  it("NotFoundError: 404 и код NOT_FOUND", () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND)
    expect(err.toBody()).toEqual({ error: { code: "NOT_FOUND", message: "Ресурс не найден" } })
  })

  it("ValidationApiError: 422 с деталями", () => {
    const err = new ValidationApiError("bad", { field: "email" })
    expect(err.statusCode).toBe(422)
    expect(err.toBody().error.details).toEqual({ field: "email" })
  })

  it("UnauthorizedError и RateLimitedError", () => {
    expect(new UnauthorizedError().statusCode).toBe(401)
    expect(new RateLimitedError().statusCode).toBe(429)
    expect(new RateLimitedError().code).toBe(ERROR_CODES.RATE_LIMITED)
  })

  it("ConflictError и StockError возвращают 409", () => {
    expect(new ConflictError("x").statusCode).toBe(409)
    expect(new StockError().statusCode).toBe(409)
    expect(new StockError().code).toBe(ERROR_CODES.STOCK)
  })

  it("наследуется от Error с корректным именем", () => {
    const err = new NotFoundError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("ApiException")
  })
})
