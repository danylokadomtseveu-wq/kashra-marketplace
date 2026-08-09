import Link from "next/link"
import type { Category } from "@/lib/types"

const FEATURED_COUNT = 24

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const games = categories
    .filter((category) => !category.parentId)
    .sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0))

  const featured = games.slice(0, FEATURED_COUNT)
  const sidebar = games.slice(0, 8)

  return (
    <div className="home-directory">
      <aside className="games-sidebar" aria-label="Популярные игры">
        <div className="games-sidebar-title">ВАШИ ИГРЫ</div>
        <div className="games-sidebar-list">
          {sidebar.map((game) => (
            <Link key={game.id} href={`/game/${game.slug}`} className="games-sidebar-item">
              <span className="games-sidebar-icon">{game.name.slice(0, 1).toUpperCase()}</span>
              <span className="games-sidebar-name">{game.name}</span>
              <span className="games-sidebar-count">{(game._count?.products ?? 0).toLocaleString("ru-RU")}</span>
            </Link>
          ))}
        </div>
        <Link href="/catalog" className="games-sidebar-all">Все игры</Link>
      </aside>

      <section className="featured-games" aria-label="Популярные игры и категории">
        <div className="featured-games-grid">
          {featured.map((game) => (
            <article key={game.id} className="featured-game">
              <h2 className="featured-game-title">
                <Link href={`/game/${game.slug}`}>{game.name}</Link>
              </h2>
              <ul className="featured-game-links">
                {(game.children ?? []).slice(0, 6).map((child) => (
                  <li key={child.id}>
                    <Link href={`/game/${game.slug}/${child.slug}`}>{child.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href={`/catalog?categoryId=${game.id}`}>Все предложения</Link>
                </li>
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
