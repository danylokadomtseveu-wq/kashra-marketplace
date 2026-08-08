import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchListings(q: string) {
  const url = new URL(`${API_URL}/search`)
  if (q) url.searchParams.set("q", q)
  url.searchParams.set("limit", "50")
  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const listings = await fetchListings(params.q ?? "")

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

      <table className="lot-table">
        <thead>
          <tr>
            <th style={{ width: "22%" }}>Продавец</th>
            <th>Товар</th>
            <th style={{ width: "10%" }}>Кол-во</th>
            <th style={{ width: "12%", textAlign: "right" }}>Цена</th>
            <th style={{ width: "90px" }}></th>
          </tr>
        </thead>
        <tbody>
          {listings.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                Ничего не найдено
              </td>
            </tr>
          ) : (
            listings.map((item: {
              id: string
              title: string
              price: string
              stock?: number
              category?: { name: string }
              seller?: { user?: { name: string }; rating?: number; online?: boolean }
            }) => (
              <tr key={item.id}>
                <td>
                  <div className="seller-cell">
                    <div className="seller-avatar">
                      {(item.seller?.user?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="seller-name">
                        {item.seller?.user?.name ?? "Продавец"}
                      </div>
                      <div className="seller-rating">
                        ★ {item.seller?.rating?.toFixed(1) ?? "5.0"}
                        <span className={`seller-status ${item.seller?.online ? "online" : "offline"}`} />
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <Link href={`/products/${item.id}`}>
                    <div className="lot-title">{item.title}</div>
                    <div className="lot-subtitle">{item.category?.name ?? ""}</div>
                  </Link>
                </td>
                <td>
                  <span className={`lot-qty ${(item.stock ?? 0) < 3 ? "lot-qty-low" : ""}`}>
                    {item.stock ?? "∞"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="lot-price">
                    {Number(item.price).toLocaleString("ru-RU")} ₽
                  </span>
                </td>
                <td>
                  <button className="buy-btn">Купить</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
