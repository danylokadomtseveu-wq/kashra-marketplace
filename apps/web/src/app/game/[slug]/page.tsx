import Link from "next/link"
import { ProductRow } from "@/components/ProductRow"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchCategory(slug: string) {
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

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: gameSlug } = await params
  const category = await fetchCategory(gameSlug)
  if (!category) {
    return (
      <div>
        <div className="breadcrumb"><Link href="/">Главная</Link><span className="breadcrumb-sep">/</span><Link href="/catalog">Все игры</Link></div>
        <div className="page-header"><h1 className="page-title">Игра не найдена</h1></div>
      </div>
    )
  }

  const listings = await fetchListings(category.id)

  return (
    <div>
      <div className="breadcrumb"><Link href="/">Главная</Link><span className="breadcrumb-sep">/</span><Link href="/catalog">Все игры</Link><span className="breadcrumb-sep">/</span><span>{category.name}</span></div>
      <div className="page-header">
        <div>
          <div className="page-kicker">ИГРА</div>
          <h1 className="page-title">{category.name}</h1>
        </div>
      </div>
      <div className="cat-tabs" style={{ marginBottom: 18 }}>
        <Link href={`/game/${gameSlug}`} className="cat-tab active">Все предложения</Link>
        {(category.children ?? []).map((child: { slug: string; name: string }) => (
          <Link key={child.slug} href={`/game/${gameSlug}/${child.slug}`} className="cat-tab">
            {child.name}
          </Link>
        ))}
      </div>
      <ProductRow listings={listings} empty="В этой игре пока нет предложений." />
    </div>
  )
}