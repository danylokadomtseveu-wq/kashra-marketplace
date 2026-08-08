import Link from "next/link"
import type { Game } from "@/data/games"

function slugify(value: string): string {
  return value.toLowerCase().replace(/['’&:]/g, "").replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "")
}

export function GameItem({ game }: { game: Game }) {
  const gameSlug = slugify(game.name)
  return (
    <div className="promo-game-item">
      <div className="game-title">
        <Link href={`/game/${gameSlug}`}>{game.name}</Link>
      </div>
      <ul className="game-links">
        {game.links.map((link) => (
          <li key={link}>
            <Link href={`/game/${gameSlug}/${slugify(link)}`}>{link}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
