import Link from "next/link"
import { ProductRow } from "@/components/ProductRow"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchListings(categoryId: string) {
  const url = new URL(`${API_URL}/search`)
  url.searchParams.set("categoryId", categoryId)
  url.searchParams.set("limit", "100")
  url.searchParams.set("sort", "newest")
  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

export default async function GameCategoryPage({ params }: { params: Promise<{ slug: string; category: string }> }) {
  const { slug: gameSlug, category: categorySlug } = await params
  const game = await fetchBySlug(gameSlug)
  const sub = await fetchBySlug(categorySlug)

  if (!game || !sub) {
    return (
      <div>
        <div className="breadcrumb"><Link href="/">Главная</Link><span className="breadcrumb-sep">/</span><Link href="/catalog">Все игры</Link></div>
        <div className="page-header"><h1 className="page-title">Раздел не найден</h1></div>
      </div>
    )
  }

  const listings = await fetchListings(sub.id)

  return (
    <div>
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/catalog">Все игры</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/game/${game.slug}`}>{game.name}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{sub.name}</span>
      </div>
      <div className="page-header">
        <div>
          <div className="page-kicker">{game.name}</div>
          <h1 className="page-title">{sub.name}</h1>
        </div>
      </div>
      <div className="cat-tabs" style={{ marginBottom: 18 }}>
        <Link href={`/game/${game.slug}`} className="cat-tab">Все предложения</Link>
        <Link href={`/game/${game.slug}/${sub.slug}`} className="cat-tab active">{sub.name}</Link>
      </div>
      <ProductRow listings={listings} empty={`В разделе «${sub.name}» пока нет предложений.`} />
    </div>
  )
}