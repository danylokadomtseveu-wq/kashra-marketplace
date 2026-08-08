export type Role = "USER" | "SELLER" | "ADMIN"

export type UserStatus = "ACTIVE" | "BANNED" | "UNVERIFIED"

export interface PublicUser {
  id: string
  email: string
  name: string
  role: Role
  status: UserStatus
  avatarUrl: string | null
  createdAt: string
}

export interface SellerProfile {
  id: string
  userId: string
  name: string
  description: string
  verificationStatus: "NONE" | "PENDING" | "VERIFIED"
  ratingCache: number
  salesCount: number
  createdAt: string
}

export type Currency = "RUB" | "USD"

export type ProductAvailability = "IN_STOCK" | "OUT_OF_STOCK" | "ON_REQUEST"

export interface PublicProduct {
  id: string
  slug: string
  title: string
  description: string
  sellerId: string
  sellerName: string
  categoryId: string
  brandId: string | null
  price: number
  oldPrice: number | null
  currency: Currency
  availability: ProductAvailability
  stock: number
  attrs: Record<string, string>
  images: string[]
  rating: number
  reviewCount: number
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  title: string
  attrs: Record<string, string>
  price: number | null
  stock: number
}

export interface CartItemDto {
  productId: string
  variantId: string | null
  qty: number
  title: string
  price: number
  stock: number
}

export interface CartDto {
  id: string
  items: CartItemDto[]
  total: number
}

export interface OrderItemDto {
  productId: string
  variantId: string | null
  title: string
  price: number
  qty: number
  total: number
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"

export interface OrderDto {
  id: string
  userId: string
  status: OrderStatus
  items: OrderItemDto[]
  total: number
  currency: Currency
  createdAt: string
  paidAt: string | null
  completedAt: string | null
}

export interface ReviewDto {
  id: string
  productId: string
  authorId: string
  authorName: string
  rating: number
  text: string
  moderated: boolean
  createdAt: string
}

export interface CategoryDto {
  id: string
  slug: string
  name: string
  parentId: string | null
  sort: number
}

export interface BrandDto {
  id: string
  slug: string
  name: string
}

export interface NotificationDto {
  id: string
  type: string
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
}
