import Link from "next/link"
import type { Category } from "@/lib/types"

export function GameItem({ category }: { category: Category }) {
  const count = category._count?.products ?? 0
  return (
    <div className="promo-game-item">
      <div className="game-title">
        <Link href={`/game/${category.slug}`}>{category.name}</Link>
      </div>
      <ul className="game-links">
        {(category.children ?? []).slice(0, 5).map((child) => (
          <li key={child.id}>
            <Link href={`/game/${category.slug}/${child.slug}`}>{child.name}</Link>
          </li>
        ))}
        <li>
          <Link href={`/catalog?categoryId=${category.id}`}>
            {count > 0 ? `Предложений: ${count}` : "Нет предложений"}
          </Link>
        </li>
      </ul>
    </div>
  )
}