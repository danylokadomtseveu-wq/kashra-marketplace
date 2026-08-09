export type Role = "USER" | "SELLER" | "ADMIN"
export type UserStatus = "ACTIVE" | "BANNED" | "DELETED"
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "CONFIRMED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED"
  | "COMPLETED"
export type PaymentStatus = "CREATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "CANCELLED"
export type ProductAvailability = "ACTIVE" | "PAUSED" | "SOLD_OUT" | "HIDDEN"

export interface Category {
  id: string
  slug: string
  name: string
  parentId: string | null
  sort: number
  isActive: boolean
  children?: Category[]
  _count?: { products?: number }
}

export interface Brand {
  id: string
  slug: string
  name: string
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt: string
  sort: number
}

export interface ProductVariant {
  id: string
  productId: string
  title: string
  attrs: Record<string, unknown>
  price: string | null
  stock: number
}

export interface InventorySummary {
  id?: string
  productId?: string
  stock: number
  reserved: number
}

export interface Product {
  id: string
  slug: string
  sellerId: string
  categoryId: string
  brandId: string | null
  title: string
  description: string
  price: string
  oldPrice: string | null
  currency: string
  availability: ProductAvailability
  attrs: Record<string, unknown>
  ratingCache?: string
  reviewCount?: number
  publishedAt: string
  softDeleted?: boolean
  createdAt?: string
  updatedAt?: string
  category?: { id: string; slug: string; name: string }
  brand?: Brand | null
  inventory?: InventorySummary | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  seller?: { id: string; description?: string; ratingCache?: string; salesCount?: number; user?: { id: string; name: string } }
  _count?: { reviews?: number }
}export interface ProductSearchResponse {
  items: Product[]
  nextCursor: string | null
  count: number
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  variantId: string | null
  qty: number
  createdAt: string
  product: {
    id: string
    slug: string
    title: string
    price: string
    currency: string
    availability: ProductAvailability
    inventory?: InventorySummary | null
  }
}

export interface Cart {
  id: string
  userId: string | null
  guestId: string | null
  mergedAt: string | null
  items: CartItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string | null
  title: string
  price: string
  qty: number
}

export interface InventoryReservation {
  id: string
  inventoryId: string
  orderId: string
  qty: number
  status: "ACTIVE" | "RELEASED" | "CONSUMED" | "EXPIRED"
  expiresAt: string
  createdAt: string
}

export interface Payment {
  id: string
  orderId: string | null
  userId: string | null
  provider: "WALLET" | "STRIPE" | "YOOKASSA"
  providerPaymentId: string | null
  amount: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  total: string
  currency: string
  itemsSummary: { itemCount?: number; productTitles?: string[] }
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  reservations?: InventoryReservation[]
  payments?: Payment[]
}

export interface WalletBalance {
  id: string
  userId: string
  available: string
  frozen: string
  updatedAt: string
}

export interface SellerProfile {
  id: string
  userId: string
  description: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  ratingCache: string
  salesCount: number
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; createdAt: string }
}

export interface SellerStats {
  productCount: number
  orderCount: number
  revenue: string
  ratingCache: string
  salesCount: number
}

export interface Review {
  id: string
  productId: string
  authorId: string
  rating: number
  text: string
  moderated: boolean
  createdAt: string
  updatedAt: string
  author?: { id: string; name: string }
}

export interface Favorite {
  userId: string
  productId: string
  createdAt: string
  product?: Product
}

export interface Notification {
  id: string
  userId: string
  type: "ORDER" | "PAYMENT" | "REVIEW" | "SYSTEM" | "PROMOTION"
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export interface Coupon {
  code: string
  type: "PERCENT" | "FIXED"
  value: string
}

export interface Promotion {
  id: string
  title: string
  type: "PERCENT" | "FIXED"
  value: string
  startsAt: string
  endsAt: string
  scope: Record<string, unknown>
}

export interface PaginationParams {
  cursor?: string
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
}