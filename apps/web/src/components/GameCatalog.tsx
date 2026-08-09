import type { Category } from "@/lib/types"
import { GameItem } from "./GameItem"

export function GameCatalog({ categories }: { categories: Category[] }) {
  const games = categories
    .filter((category) => !category.parentId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))

  return (
    <section className="all-games" aria-label="Все игры">
      <div className="all-games-heading">
        <h2>Все игры</h2>
        <span>{games.length.toLocaleString("ru-RU")}</span>
      </div>
      <div className="all-games-grid">
        {games.map((game) => (
          <div key={game.id} className="all-game-cell">
            <GameItem category={game} />
          </div>
        ))}
      </div>
    </section>
  )
}
