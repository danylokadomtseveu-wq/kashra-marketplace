import type { Category } from "@/lib/types"
import { GameItem } from "./GameItem"

export function CategoryGroup({ letter, categories }: { letter: string; categories: Category[] }) {
  return (
    <div className="promo-game-list-block" id={`letter-${letter}`}>
      <div className="promo-game-list-title">{letter}</div>
      <div className="game-row">
        {categories.map((cat) => (
          <div key={cat.id} className="game-cell">
            <GameItem category={cat} />
          </div>
        ))}
      </div>
    </div>
  )
}