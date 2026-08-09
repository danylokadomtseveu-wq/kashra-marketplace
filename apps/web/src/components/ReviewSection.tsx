import { Suspense } from "react"
import { listReviews } from "@/lib/reviews"
import { ReviewList, ReviewSummary } from "@/components/ReviewList"
import { ReviewForm } from "@/components/ReviewForm"
import type { Product } from "@/lib/types"

interface ReviewSectionProps {
  product: Pick<Product, "id"> & { ratingCache?: string; reviewCount?: number }
}

async function ReviewsLoader({ productId }: { productId: string }) {
  const reviews = await listReviews(productId)
  return (
    <>
      <ReviewSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </>
  )
}

export function ReviewSection({ product }: ReviewSectionProps) {
  const productRating = Number(product.ratingCache ?? 0)
  return (
    <section className="reviews-section">
      <h3 className="reviews-title">Отзывы</h3>
      <Suspense fallback={<div className="form-note">Загрузка отзывов…</div>}>
        <ReviewsLoader productId={product.id} />
      </Suspense>

      <div style={{ marginTop: 26 }}>
        <h4 className="product-section-title" style={{ marginBottom: 10 }}>
          Оставить отзыв
        </h4>
        <p className="form-note" style={{ marginBottom: 8 }}>
          Рейтинг товара: {productRating > 0 ? `${productRating.toFixed(1)} ★` : "ещё нет оценок"}
          {product.reviewCount ? ` · ${product.reviewCount} ${product.reviewCount === 1 ? "отзыв" : "отзывов"}` : ""}
        </p>
        <ReviewForm productId={product.id} />
      </div>
    </section>
  )
}
