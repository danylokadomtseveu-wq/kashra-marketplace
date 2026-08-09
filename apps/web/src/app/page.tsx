import { CategoryGrid } from "@/components/CategoryGrid"
import { GameCatalog } from "@/components/GameCatalog"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchCategories() {
  const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const categories = await fetchCategories()
  return (
    <div className="kashra-home kashra-home-clean">
      <section className="kashra-directory">
        <CategoryGrid categories={categories} />
      </section>

      <section className="kashra-catalog-section">
        <GameCatalog categories={categories} />
      </section>
    </div>
  )
}