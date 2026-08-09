import { apiDelete, apiGet, apiPost, apiRequest, apiPatch } from "./api"
import type { Product, ProductSearchResponse } from "./types"

export interface ProductListParams {
  categoryId?: string
  brandId?: string
  sellerId?: string
  availability?: string
  cursor?: string
  limit?: number
}

export interface SearchParams {
  q?: string
  categoryId?: string
  brandId?: string
  sellerId?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: string
  cursor?: string
  limit?: number
}

export async function listProducts(params: ProductListParams): Promise<Product[]> {
  return apiGet<Product[]>("/products", { auth: false, query: { ...params } })
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return apiGet<Product>(`/products/${slug}`, { auth: false })
}

export async function searchProducts(params: SearchParams): Promise<ProductSearchResponse> {
  return apiRequest<ProductSearchResponse>("/search", {
    auth: false,
    query: { ...params, inStock: params.inStock ? true : undefined },
  })
}

export interface CreateProductInput {
  slug: string
  title: string
  description?: string
  categoryId: string
  brandId?: string
  price: number
  oldPrice?: number
  currency?: "RUB" | "USD"
  attrs?: Record<string, unknown>
  stock?: number
  variants?: { id?: string; title: string; attrs?: Record<string, unknown>; price?: number; stock?: number }[]
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  return apiPost<Product>("/products", { body: input })
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  return apiPatch<Product>(`/products/${id}`, { body: input })
}

export async function deleteProduct(id: string): Promise<Product> {
  return apiDelete<Product>(`/products/${id}`)
}

export interface UploadResult {
  ok: boolean
  count: number
}

export async function uploadProductImages(productId: string, files: File[]): Promise<UploadResult> {
  const form = new FormData()
  files.forEach((f) => form.append("files", f))
  return apiRequest<UploadResult>(`/products/${productId}/images`, { method: "POST", body: form })
}

export function deleteProductImage(productId: string, imageId: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/products/${productId}/images/${imageId}`)
}