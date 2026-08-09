import Link from "next/link"
import type { Category } from "@/lib/types"

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const games = categories.sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0))
  return (
    <div className="promo-cats">
      <div className="promo-cats-label">ВАШИ<br />ИГРЫ</div>
      <div className="cat-grid">
        {games.map((cat) => (
          <div key={cat.id} className="cat-item">
            <div className="promo-cat-title">
              <Link href={`/game/${cat.slug}`}>{cat.name}</Link>
            </div>
            <ul className="promo-cat-links">
              {(cat.children?.length ? cat.children : []).slice(0, 7).map((child) => (
                <li key={child.id}>
                  <Link href={`/game/${cat.slug}/${child.slug}`}>{child.name}</Link>
                </li>
              ))}
              <li>
                <Link href={`/catalog?categoryId=${cat.id}`}>
                  Все предложения · {cat._count?.products ?? 0}
                </Link>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}