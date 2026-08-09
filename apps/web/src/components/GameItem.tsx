import Link from "next/link"
import type { Category } from "@/lib/types"

export function GameItem({ category }: { category: Category }) {
  const count = category._count?.products ?? 0

  return (
    <div className="promo-game-item">
      <h2 className="game-title">
        <Link href={`/game/${category.slug}`}>{category.name}</Link>
      </h2>
      <ul className="game-links">
        {(category.children ?? []).slice(0, 6).map((child) => (
          <li key={child.id}>
            <Link href={`/game/${category.slug}/${child.slug}`}>{child.name}</Link>
          </li>
        ))}
        <li>
          <Link href={`/catalog?categoryId=${category.id}`}>
            {count > 0 ? `Все предложения · ${count.toLocaleString("ru-RU")}` : "Все предложения"}
          </Link>
        </li>
      </ul>
    </div>
  )
}
