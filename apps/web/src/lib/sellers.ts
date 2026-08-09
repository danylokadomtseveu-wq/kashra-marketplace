import { apiGet, apiPatch, apiRequest } from "./api"
import type { Order, SellerProfile, SellerStats } from "./types"

export async function getSeller(id: string): Promise<SellerProfile> {
  return apiGet<SellerProfile>(`/sellers/${id}`, { auth: false })
}

export async function updateSellerMe(input: { name?: string; description?: string }): Promise<SellerProfile> {
  return apiPatch<SellerProfile>("/sellers/me", { body: input })
}

export async function getSellerMyProducts(cursor?: string, limit = 20) {
  return apiRequest<unknown[]>("/sellers/me/products", { query: { cursor, limit } })
}

export async function getSellerMyOrders(cursor?: string, limit = 20) {
  return apiRequest<Order[]>("/sellers/me/orders", { query: { cursor, limit } })
}

export async function getSellerStats(): Promise<SellerStats> {
  return apiGet<SellerStats>("/sellers/me/stats")
}