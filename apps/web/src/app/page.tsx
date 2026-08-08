import { CategoryGrid } from "@/components/CategoryGrid"
import { GameCatalog } from "@/components/GameCatalog"

export default function HomePage() {
  return (
    <div className="kashra-home kashra-home-clean">
      <section className="kashra-directory">
        <CategoryGrid />
      </section>

      <section className="kashra-catalog-section">
        <GameCatalog />
      </section>
    </div>
  )
}
