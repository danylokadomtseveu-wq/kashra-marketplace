import { apiGet, apiPost } from "./api"
import type { Order } from "./types"

export interface CheckoutInput {
  idempotencyKey: string
  addressId?: string | null
  productId?: string
  variantId?: string | null
  qty?: number
  itemIds?: string[]
  couponCode?: string
}

export async function listOrders(): Promise<Order[]> {
  return apiGet<Order[]>("/orders")
}

export async function getOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`)
}

export async function createOrder(input: CheckoutInput): Promise<Order> {
  return apiPost<Order>("/orders", { body: input })
}

export async function payOrder(id: string): Promise<Order> {
  return apiPost<Order>(`/orders/${id}/pay`)
}

export async function confirmOrder(id: string): Promise<Order> {
  return apiPost<Order>(`/orders/${id}/confirm`)
}

export async function cancelOrder(id: string): Promise<Order> {
  return apiPost<Order>(`/orders/${id}/cancel`)
}