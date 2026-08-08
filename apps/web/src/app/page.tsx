import { CategoryGrid } from "@/components/CategoryGrid"
import { GameCatalog } from "@/components/GameCatalog"

export default async function HomePage() {
  return (
    <div>
      <CategoryGrid />
      <GameCatalog />
    </div>
  )
}