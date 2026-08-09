import Link from "next/link"
import { Suspense } from "react"
import { RequireAuth } from "@/lib/session"
import { listFavoriteProducts } from "@/lib/favorites"
import { ProductRow } from "@/components/ProductRow"
import type { Product } from "@/lib/types"
import type { ComponentType } from "react"

interface Listing {
  id: string
  title: string
  price: string
  stock?: number
  category?: { name: string }
  seller?: { user?: { name: string }; ratingCache?: string; salesCount?: number }
}

function toListing(p: Product): Listing {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    stock: p.inventory?.stock,
    category: p.category,
    seller: p.seller,
  }
}

async function FavoritesList() {
  let products: Product[] = []
  let error: string | null = null
  try {
    products = await listFavoriteProducts()
  } catch (e) {
    error = (e as Error)?.message ?? "Не удалось загрузить избранное"
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="form-error">{error}</div>
        <div style={{ marginTop: 12 }}>
          <Link href="/catalog" className="header-btn">Перейти в каталог</Link>
        </div>
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div>Вы ещё ничего не добавили в избранное</div>
          <Link href="/catalog" className="buy-btn" style={{ marginTop: 12, display: "inline-block" }}>
            Просмотреть каталог
          </Link>
        </div>
      </div>
    )
  }

  const listings = products.map(toListing)
  return <ProductRow listings={listings} empty="В избранном пока ничего нет" favorited />
}

const SuspenseFallback: ComponentType = () => (
  <div className="page-kicker">Загрузка избранного…</div>
)

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Избранное</h1>
          </div>
        </div>
        <Suspense fallback={<SuspenseFallback />}>
          <FavoritesList />
        </Suspense>
      </div>
    </RequireAuth>
  )
}
