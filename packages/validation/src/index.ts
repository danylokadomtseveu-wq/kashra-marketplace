import { z } from "zod"

export const emailSchema = z.string().trim().email().max(254).toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен содержать минимум 8 символов")
  .max(72, "Пароль слишком длинный")
  .regex(/[a-zA-Z]/, "Пароль должен содержать буквы")
  .regex(/[0-9]/, "Пароль должен содержать цифры")

export const nameSchema = z.string().trim().min(2, "Минимум 2 символа").max(64)

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Пароль обязателен"),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

export const sellerProfileSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(2000).default(""),
})

export const idParamSchema = z.object({
  id: z.string().min(1).max(64),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(128),
})

export const cursorPaginationSchema = z.object({
  cursor: z.string().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const productSchema = z.object({
  slug: z.string().trim().min(1).max(128),
  title: z.string().trim().min(3, "Минимум 3 символа").max(200),
  description: z.string().trim().max(10000).default(""),
  categoryId: z.string().min(1),
  brandId: z.string().nullable().optional(),
  price: z.coerce.number().positive("Цена должна быть больше нуля").max(1_000_000_000),
  oldPrice: z.coerce.number().positive().nullable().optional(),
  currency: z.enum(["RUB", "USD"]).default("RUB"),
  attrs: z.record(z.string(), z.string()).default({}),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(100),
        attrs: z.record(z.string(), z.string()).default({}),
        price: z.coerce.number().positive().nullable().optional(),
        stock: z.coerce.number().int().min(0).default(0),
      }),
    )
    .max(100)
    .default([]),
  stock: z.coerce.number().int().min(0).default(0),
})

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  qty: z.coerce.number().int().min(1).max(999).default(1),
})

export const cartUpdateSchema = z.object({
  qty: z.coerce.number().int().min(0).max(999),
})

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  addressId: z.string().nullable().optional(),
  itemIds: z.array(z.string()).optional(),
  couponCode: z.string().trim().toUpperCase().max(64).optional(),
})

export const couponValidateContextSchema = z.object({
  code: z.string().trim().min(1).max(64),
  cartTotal: z.coerce.number().nonnegative().optional(),
  itemIds: z.array(z.string()).optional(),
})

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(1, "Текст отзыва обязателен").max(2000),
})

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1).max(64),
})

export const searchSchema = z.object({
  q: z.string().trim().max(200).default(""),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["relevance", "newest", "price_asc", "price_desc", "rating"]).default("relevance"),
  cursor: z.string().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CartAddInput = z.infer<typeof cartAddSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type SearchInput = z.infer<typeof searchSchema>
