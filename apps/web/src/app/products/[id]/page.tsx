import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductActions } from "@/components/ProductActions"
import { FavoriteButton } from "@/components/FavoriteButton"
import { ReviewSection } from "@/components/ReviewSection"
import type { Product } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await fetchProduct(id)
  if (!product) notFound()

  const rating = Number(product.seller?.ratingCache ?? 0)
  const specs = [
    { label: "Наличие", value: `${product.inventory?.stock ?? 0} шт.` },
    { label: "Продано", value: `${product.seller?.salesCount ?? 0}` },
    { label: "Оценка товара", value: `${Number(product.ratingCache ?? 0).toFixed(1)} ★` },
    { label: "Опубликовано", value: new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(product.publishedAt)) },
    { label: "Категория", value: product.category?.name ?? "—" },
    { label: "Передача", value: "Автоматическая" },
  ]

  return (
    <div>
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/catalog">Каталог</Link>
        <span className="breadcrumb-sep">/</span>
        {product.category?.slug ? (
          <>
            <Link href={`/game/${product.category.slug}`}>{product.category.name}</Link>
            <span className="breadcrumb-sep">/</span>
          </>
        ) : null}
        <span className="breadcrumb-current">{product.title}</span>
      </div>

      <div className="product-layout">
        {product.images && product.images.length > 0 ? (
          <div className="product-gallery">
            {product.images
              .slice()
              .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
              .slice(0, 6)
              .map((img) => (
                <img key={img.id} src={img.url} alt={img.alt ?? product.title} className="gallery-thumb" />
              ))}
          </div>
        ) : (
          <div className="product-image-placeholder">🎮</div>
        )}
        <div>
          <h1 className="product-title">{product.title}</h1>
          <div className="product-seller">
            Продавец:{" "}
            <Link href={`/seller/${product.seller?.id ?? ""}`}>
              {product.seller?.user?.name ?? "Продавец"}
            </Link>
            <span className="product-seller-note"> · ★ {rating.toFixed(1)}</span>
          </div>

          <div className="product-price-block">
            <div className="product-price">
              {Number(product.price).toLocaleString("ru-RU")} ₽
              {Number(product.oldPrice ?? 0) > 0 ? (
                <div className="product-price-old">{Number(product.oldPrice).toLocaleString("ru-RU")} ₽</div>
              ) : null}
            </div>
            <FavoriteButton productId={product.id} />
            <ProductActions
              product={{
                id: product.id,
                title: product.title,
                price: String(product.price),
              }}
            />
          </div>

          <div className="product-section">
            <h3 className="product-section-title">Описание</h3>
            <div className="product-description">{product.description || "Описание отсутствует"}</div>
          </div>

          <div className="product-section">
            <h3 className="product-section-title">Характеристики</h3>
            <div className="product-specs">
              {specs.map((s) => (
                <div key={s.label} className="product-spec-row">
                  <span className="product-spec-label">{s.label}</span>
                  <span className="product-spec-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {Number(product.inventory?.stock ?? 0) <= 0 ? (
            <div className="empty-state">Товар временно отсутствует</div>
          ) : null}
        </div>
      </div>

      <ReviewSection
        product={{
          id: product.id,
          ratingCache: product.ratingCache,
          reviewCount: product.reviewCount,
        }}
      />
    </div>
  )
}