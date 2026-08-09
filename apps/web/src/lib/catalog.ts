import { apiGet, apiPost } from "./api"
import type { Category } from "./types"
import type { Coupon, Promotion } from "./types"

export async function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories", { auth: false })
}

export async function getCategory(slug: string): Promise<Category> {
  return apiGet<Category>(`/categories/${slug}`, { auth: false })
}

export async function getPromotions(): Promise<Promotion[]> {
  return apiGet<Promotion[]>("/promotions", { auth: false })
}

export async function validateCoupon(code: string): Promise<Coupon> {
  return apiPost<Coupon>("/coupons/validate", { body: { code } })
}