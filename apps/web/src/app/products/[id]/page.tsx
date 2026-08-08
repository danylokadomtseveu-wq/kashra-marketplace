import Link from "next/link"
import { ProductActions } from "@/components/ProductActions"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchProduct(id: string) { const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" }); if (!res.ok) return null; return res.json() }

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await fetchProduct(id)
  if (!product) return <div className="empty-state"><div className="empty-state-title">Товар не найден</div><div>Возможно, он был удалён или продан.</div><Link href="/catalog" className="empty-state-link">Вернуться в каталог</Link></div>
  return (
    <div>
      <div className="breadcrumb"><Link href="/">Главная</Link><span className="breadcrumb-sep">/</span><Link href="/catalog">Каталог</Link><span className="breadcrumb-sep">/</span><span className="breadcrumb-current">{product.title}</span></div>
      <div className="product-layout">
        <div className="product-image-placeholder">🎮</div>
        <div>
          <h1 className="product-title">{product.title}</h1>
          <div className="product-seller">Продавец: <Link href={`/seller/${product.seller?.id ?? "unknown"}`}>{product.seller?.user?.name ?? "Продавец"}</Link></div>
          <div className="product-price-block"><div className="product-price">{Number(product.price).toLocaleString("ru-RU")} ₽</div>{product.oldPrice&&<div className="product-price-old">{Number(product.oldPrice).toLocaleString("ru-RU")} ₽</div>}<ProductActions product={{id:product.id,title:product.title,price:String(product.price)}} /></div>
          <div className="product-section"><h3 className="product-section-title">Описание</h3><div className="product-description">{product.description||"Описание отсутствует"}</div></div>
          <div className="product-section"><h3 className="product-section-title">Характеристики</h3><div className="product-specs"><div className="product-spec-row"><span className="product-spec-label">В наличии</span><span className="product-spec-value">{product.inventory?.stock??0} шт.</span></div><div className="product-spec-row"><span className="product-spec-label">Категория</span><span className="product-spec-value">{product.category?.name??"—"}</span></div><div className="product-spec-row"><span className="product-spec-label">Доставка</span><span className="product-spec-value">Автоматическая</span></div><div className="product-spec-row"><span className="product-spec-label">Гарантия</span><span className="product-spec-value">24 часа</span></div></div></div>
        </div>
      </div>
    </div>
  )
}
