import { apiDelete, apiGet, apiPatch, apiPost } from "./api"
import type { Cart } from "./types"

const GUEST_COOKIE = "__guest__"

export function getGuestId(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)__guest__=([^;]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function ensureGuestId(): string {
  const existing = getGuestId()
  if (existing) return existing
  const id = crypto.randomUUID()
  document.cookie = `${GUEST_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`
  return id
}

export async function getCart(): Promise<Cart> {
  ensureGuestId()
  return apiGet<Cart>("/cart", { auth: false })
}

export async function addToCart(productId: string, variantId?: string | null, qty = 1): Promise<Cart> {
  ensureGuestId()
  return apiPost<Cart>("/cart/items", { auth: false, body: { productId, variantId: variantId ?? null, qty } })
}

export async function updateCartItem(itemId: string, qty: number): Promise<Cart> {
  return apiPatch<Cart>(`/cart/items/${itemId}`, { auth: false, body: { qty } })
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return apiDelete<Cart>(`/cart/items/${itemId}`, { auth: false })
}

export async function mergeCart(): Promise<Cart> {
  return apiPost<Cart>("/cart/merge", { auth: true })
}

export function cartTotals(cart: Cart): { total: number; itemCount: number } {
  const total = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.qty, 0)
  const itemCount = cart.items.reduce((sum, item) => sum + item.qty, 0)
  return { total, itemCount }
}