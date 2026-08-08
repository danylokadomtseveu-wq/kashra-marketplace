import { useMemo } from "react"
import { GAMES } from "@/data/games"
import { Alphabet } from "./Alphabet"
import { CategoryGroup } from "./CategoryGroup"

function firstLetter(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function GameCatalog() {
  const available = useMemo(() => {
    const set = new Set<string>()
    for (const g of GAMES) set.add(firstLetter(g.name))
    return set
  }, [])

  const letters = useMemo(
    () => Array.from(new Set(GAMES.map((g) => firstLetter(g.name)))).sort(),
    [],
  )

  return (
    <div className="promo-games promo-games-all">
      <div className="promo-game-list-header">
        <Alphabet available={available} active="" />
      </div>
      <div className="promo-game-list">
        {letters.map((letter) => (
          <CategoryGroup key={letter} letter={letter} />
        ))}
      </div>
    </div>
  )
}