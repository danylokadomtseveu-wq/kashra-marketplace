import { apiPost, apiDelete, apiRequest } from "./api"
import type { Review } from "./types"

export interface ReviewInput {
  rating: number
  text: string
}

export async function listReviews(productId: string, cursor?: string, limit = 20): Promise<Review[]> {
  return apiRequest<Review[]>(`/products/${productId}/reviews`, {
    query: { cursor, limit },
    auth: false,
  })
}

export async function createReview(productId: string, input: ReviewInput): Promise<Review> {
  return apiPost<Review>(`/products/${productId}/reviews`, { body: input })
}

export async function deleteReview(reviewId: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/reviews/${reviewId}`)
}
