import { GAMES } from "@/data/games"
import { GameItem } from "./GameItem"

function firstLetter(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function CategoryGroup({ letter }: { letter: string }) {
  const games = GAMES.filter((g) => firstLetter(g.name) === letter)
  if (games.length === 0) return null
  return (
    <div className="promo-game-list-block" id={`letter-${letter}`}>
      <div className="promo-game-list-title">{letter}</div>
      <div className="game-row">
        {games.map((game) => (
          <div key={game.name} className="game-cell">
            <GameItem game={game} />
          </div>
        ))}
      </div>
    </div>
  )
}