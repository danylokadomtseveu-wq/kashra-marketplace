import Link from "next/link"
import type { Game } from "@/data/games"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’&:]/g, "")
    .replace(/[^a-z0-9а-я]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function GameItem({ game }: { game: Game }) {
  return (
    <div className="promo-game-item">
      <div className="game-title">
        <Link href={`/game/${slugify(game.name)}`}>{game.name}</Link>
      </div>
      <ul className="list-inline">
        {game.links.map((link) => (
          <li key={link}>
            <a href="#">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}