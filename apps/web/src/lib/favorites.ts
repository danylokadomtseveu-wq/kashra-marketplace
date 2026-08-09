import { apiDelete, apiPost, apiRequest } from "./api"
import type { Favorite, Product } from "./types"

export async function listFavorites(cursor?: string, limit = 50): Promise<Favorite[]> {
  return apiRequest<Favorite[]>("/favorites", { query: { cursor, limit } })
}

export async function addFavorite(productId: string): Promise<Favorite> {
  return apiPost<Favorite>(`/favorites/${productId}`)
}

export async function removeFavorite(productId: string): Promise<{ count: number }> {
  return apiDelete<{ count: number }>(`/favorites/${productId}`)
}

export async function listFavoriteProducts(): Promise<Product[]> {
  const favorites = await listFavorites()
  return favorites.map((f) => f.product).filter((p): p is Product => Boolean(p))
}