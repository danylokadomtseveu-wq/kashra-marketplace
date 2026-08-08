import { describe, expect, it } from "vitest"
import { clamp, createId, formatPrice, hashString, toSlug } from "./index.js"

describe("formatPrice", () => {
  it("форматирует рубли", () => {
    const out = formatPrice(1000, "RUB")
    expect(out).toContain("₽")
    expect(out).toContain("000")
  })
  it("форматирует доллары", () => {
    expect(formatPrice(99.5, "USD")).toContain("99.50")
  })
})

describe("toSlug", () => {
  it("преобразует строку в slug", () => {
    expect(toSlug("  Counter-Strike 2 (CS2) !")).toBe("counter-strike-2-cs2")
  })
})

describe("clamp", () => {
  it("ограничивает значение диапазоном", () => {
    expect(clamp(10, 0, 5)).toBe(5)
    expect(clamp(-1, 0, 5)).toBe(0)
    expect(clamp(3, 0, 5)).toBe(3)
  })
})

describe("createId", () => {
  it("генерирует уникальные id", () => {
    const a = createId("ord-")
    const b = createId("ord-")
    expect(a.startsWith("ord-")).toBe(true)
    expect(a).not.toBe(b)
  })
})

describe("hashString", () => {
  it("детерминирован", () => {
    expect(hashString("hello")).toBe(hashString("hello"))
    expect(hashString("hello")).not.toBe(hashString("world"))
  })
})
