import { ProductRow } from "@/components/ProductRow"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchListings(q: string, categoryId: string) {
  const url = new URL(`${API_URL}/search`)
  if (q) url.searchParams.set("q", q)
  if (categoryId) url.searchParams.set("categoryId", categoryId)
  url.searchParams.set("limit", "50")
  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; categoryId?: string }> }) {
  const params = await searchParams
  const listings = await fetchListings(params.q ?? "", params.categoryId ?? "")

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {params.q ? `Поиск: ${params.q}` : "Поиск"}
        </h1>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14 }}>
        Найдено: {listings.length}
      </div>

      <ProductRow listings={listings} empty="Ничего не найдено" />
    </div>
  )
}