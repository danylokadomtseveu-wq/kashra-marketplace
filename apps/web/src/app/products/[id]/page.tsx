import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await fetchProduct(id)

  if (!product) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
        <div className="fw-600" style={{ marginBottom: 6 }}>Товар не найден</div>
        <div className="text-muted">Возможно, он был удалён или продан</div>
        <Link href="/catalog" className="btn-green header-btn" style={{ marginTop: 18, display: "inline-block" }}>Вернуться в каталог</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/catalog">Каталог</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/catalog?categoryId=${product.category?.id}`}>{product.category?.name}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{product.title}</span>
      </div>

      <div className="product-layout">
        {/* Left — image */}
        <div className="product-image">
          <div className="product-image-placeholder">
            🎮
          </div>
        </div>

        {/* Right — info */}
        <div className="product-info">
          <h1 className="product-title">{product.title}</h1>

          <div className="product-seller">
            Продавец:{" "}
            <Link href={`/seller/${product.seller?.id}`}>
              {product.seller?.user?.name ?? "—"}
            </Link>
            {" · "}
            Рейтинг: <span style={{ color: "#e1a62a" }}>★</span> {product.ratingCache ?? "—"}
          </div>

          {/* Price block */}
          <div className="card product-price-block">
            <div className="product-price">
              {Number(product.price).toLocaleString("ru-RU")} ₽
            </div>
            {product.oldPrice && (
              <div className="product-price-old">
                {Number(product.oldPrice).toLocaleString("ru-RU")} ₽
              </div>
            )}
            <div className="product-actions">
              <button className="buy-btn" style={{ padding: "8px 24px", fontSize: 13 }}>Купить</button>
              <button className="header-btn btn-ghost" style={{ padding: "8px 18px", fontSize: 13 }}>В корзину</button>
            </div>
          </div>

          {/* Description */}
          <div className="product-section">
            <h3 className="product-section-title">Описание</h3>
            <div className="product-description">
              {product.description || <span className="text-muted">Описание отсутствует</span>}
            </div>
          </div>

          {/* Characteristics */}
          <div className="product-section">
            <h3 className="product-section-title">Характеристики</h3>
            <div className="product-specs">
              <div className="product-spec-row">
                <span className="product-spec-label">В наличии</span>
                <span className="product-spec-value">{product.inventory?.stock ?? 0} шт.</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Категория</span>
                <span className="product-spec-value">{product.category?.name}</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Доставка</span>
                <span className="product-spec-value">Автоматическая</span>
              </div>
              <div className="product-spec-row">
                <span className="product-spec-label">Гарантия</span>
                <span className="product-spec-value">Возврат в течение 24 часов</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
