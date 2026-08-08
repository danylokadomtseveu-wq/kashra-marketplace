import Link from "next/link"
import { CategoryGrid } from "@/components/CategoryGrid"
import { GameCatalog } from "@/components/GameCatalog"
import { GAMES } from "@/data/games"

export default function HomePage() {
  return (
    <div className="kashra-home">
      <header className="kashra-intro">
        <div className="kashra-eyebrow">KASHRA MARKETPLACE</div>
        <h1>Игры, аккаунты и цифровые услуги</h1>
        <p>
          Покупай и продавай игровые товары в одном месте. Выбирай игру,
          категорию и нужное предложение без лишнего визуального шума.
        </p>
        <nav className="kashra-intro-links" aria-label="Основные действия">
          <Link href="/catalog">Открыть каталог</Link>
          <Link href="/search">Найти игру</Link>
        </nav>
        <div className="kashra-stats" aria-label="Статистика каталога">
          <span><strong>{GAMES.length}+</strong> игр</span>
          <span><strong>1000+</strong> предложений</span>
          <span><strong>24/7</strong> доступ к каталогу</span>
        </div>
      </header>

      <section className="kashra-directory">
        <div className="section-heading">
          <div>
            <div className="section-kicker">БЫСТРЫЙ ДОСТУП</div>
            <h2>Основные направления</h2>
          </div>
          <Link href="/catalog" className="section-link">Весь каталог →</Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="kashra-catalog-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">КАТАЛОГ</div>
            <h2>Все игры по алфавиту</h2>
          </div>
          <span className="catalog-caption">Выбери игру и категорию</span>
        </div>
        <GameCatalog />
      </section>
    </div>
  )
}
