import Link from "next/link"
import { FavoriteButton } from "./FavoriteButton"

interface Listing {
  id: string
  title: string
  price: string
  stock?: number
  category?: { name: string }
  seller?: { user?: { name: string }; ratingCache?: string; salesCount?: number }
}

export function ProductRow({ listings, empty, favorited = false }: { listings: Listing[]; empty: string; favorited?: boolean }) {
  if (!listings.length) {
    return <div className="empty-state">{empty}</div>
  }
  return (
    <table className="lot-table">
      <thead>
        <tr>
          <th style={{ width: "22%" }}>Продавец</th>
          <th>Товар</th>
          <th style={{ width: "10%" }}>Кол-во</th>
          <th style={{ width: "12%", textAlign: "right" }}>Цена</th>
          <th style={{ width: "36px" }} />
          <th style={{ width: "90px" }} />
        </tr>
      </thead>
      <tbody>
        {listings.map((item) => {
          const rating = Number(item.seller?.ratingCache ?? 0)
          return (
            <tr key={item.id}>
              <td>
                <div className="seller-cell">
                  <div className="seller-avatar">
                    {(item.seller?.user?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="seller-name">{item.seller?.user?.name ?? "Продавец"}</div>
                    <div className="seller-rating">
                      ★ {rating.toFixed(1)}
                      <span className={`seller-status ${rating >= 4.5 ? "online" : "offline"}`} />
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
                <span className="lot-price">{Number(item.price).toLocaleString("ru-RU")} ₽</span>
              </td>
              <td>
                <FavoriteButton productId={item.id} initial={favorited} size={16} />
              </td>
              <td>
                <Link href={`/products/${item.id}`} className="buy-btn">Открыть</Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}