import { describe, expect, it } from "vitest"
import {
  cartAddSchema,
  checkoutSchema,
  loginSchema,
  productSchema,
  registerSchema,
  reviewSchema,
  searchSchema,
} from "./index.js"

describe("registerSchema", () => {
  it("принимает валидные данные", () => {
    const result = registerSchema.safeParse({
      email: "User@Example.com",
      password: "secret123",
      name: "Ivan",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("user@example.com")
    }
  })

  it("отклоняет слабый пароль", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      name: "Ivan",
    })
    expect(result.success).toBe(false)
  })

  it("отклоняет невалидный email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
      name: "Ivan",
    })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("принимает email и пароль", () => {
    expect(loginSchema.safeParse({ email: "a@bc.co", password: "x" }).success).toBe(true)
  })
})

describe("productSchema", () => {
  it("принимает валидный товар", () => {
    const result = productSchema.safeParse({
      slug: "cs2-knife",
      title: "Нож Karambit",
      description: "Описание",
      categoryId: "cat-1",
      price: 1200,
      stock: 5,
    })
    expect(result.success).toBe(true)
  })

  it("отклоняет нулевую цену", () => {
    const result = productSchema.safeParse({
      slug: "cs2-knife",
      title: "Нож",
      categoryId: "cat-1",
      price: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe("reviewSchema", () => {
  it("отклоняет рейтинг вне диапазона", () => {
    expect(reviewSchema.safeParse({ rating: 6, text: "ок" }).success).toBe(false)
  })
  it("принимает валидный отзыв", () => {
    expect(reviewSchema.safeParse({ rating: 5, text: "отлично" }).success).toBe(true)
  })
})

describe("cartAddSchema", () => {
  it("коэрсит qty в число", () => {
    const result = cartAddSchema.safeParse({ productId: "p-1", qty: "3" })
    expect(result.success).toBe(true)
  })
})

describe("checkoutSchema", () => {
  it("требует idempotencyKey", () => {
    expect(checkoutSchema.safeParse({}).success).toBe(false)
    expect(checkoutSchema.safeParse({ idempotencyKey: "key-123456" }).success).toBe(true)
  })
})

describe("searchSchema", () => {
  it("принимает пустой поиск с дефолтами", () => {
    const result = searchSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.sort).toBe("relevance")
    }
  })
})
