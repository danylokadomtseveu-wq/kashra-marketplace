import type { Category } from "@/lib/types"
import { Alphabet } from "./Alphabet"
import { CategoryGroup } from "./CategoryGroup"

function firstLetter(name: string): string {
  const ch = name.charAt(0).toUpperCase()
  return /[A-Za-zА-Яа-яЁё]/.test(ch) ? ch : "#"
}

export function GameCatalog({ categories }: { categories: Category[] }) {
  const games = categories.filter((c) => !c.parentId)
  const byLetter = new Map<string, Category[]>()
  for (const g of games) {
    const letter = firstLetter(g.name)
    if (!byLetter.has(letter)) byLetter.set(letter, [])
    byLetter.get(letter)!.push(g)
  }
  const letters = Array.from(byLetter.keys()).sort()
  const index = letters.map((l) => ({ letter: l, available: true }))

  return (
    <div className="promo-games promo-games-all">
      <div className="promo-game-list-header">
        <Alphabet available={new Set(letters)} active="" />
      </div>
      <div className="promo-game-list">
        {index.map(({ letter }) => (
          <CategoryGroup key={letter} letter={letter} categories={byLetter.get(letter)!} />
        ))}
      </div>
    </div>
  )
}