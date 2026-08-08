import Link from "next/link"
import { CategoryGrid } from "@/components/CategoryGrid"
import { GameCatalog } from "@/components/GameCatalog"
import { GAMES } from "@/data/games"

const FEATURED = GAMES.slice(0, 8)

export default async function HomePage() {
  return (
    <main className="kashra-home">
      <section className="kashra-hero">
        <div className="kashra-hero-copy">
          <div className="kashra-eyebrow">KASHRA MARKETPLACE</div>
          <h1>Игры, аккаунты и цифровые услуги — в одном месте</h1>
          <p>
            Находи нужные товары, сравнивай предложения продавцов и покупай
            игровые услуги без лишнего поиска.
          </p>
          <div className="kashra-hero-actions">
            <Link href="/catalog" className="kashra-primary-btn">Смотреть каталог</Link>
            <Link href="/search" className="kashra-secondary-btn">Найти игру</Link>
          </div>
        </div>
        <div className="kashra-hero-card">
          <div className="hero-card-label">Сейчас на KASHRA</div>
          <div className="hero-card-number">{GAMES.length}+</div>
          <div className="hero-card-text">игр и направлений</div>
          <div className="hero-card-line" />
          <div className="hero-card-note">Каталог постоянно расширяется</div>
        </div>
      </section>

      <section className="kashra-featured">
        <div className="section-heading">
          <div>
            <div className="section-kicker">БЫСТРЫЙ ДОСТУП</div>
            <h2>Популярные направления</h2>
          </div>
          <Link href="/catalog" className="section-link">Весь каталог →</Link>
        </div>
        <div className="featured-grid">
          {FEATURED.map((game, index) => (
            <Link href={`/game/${game.name.toLowerCase().replace(/[^a-z0-9а-я]+/g, "-").replace(/^-+|-+$/g, "")}`} key={game.name} className="featured-card">
              <span className="featured-index">0{index + 1}</span>
              <span className="featured-name">{game.name}</span>
              <span className="featured-meta">{game.links.slice(0, 3).join(" · ")}</span>
              <span className="featured-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="kashra-directory">
        <div className="section-heading directory-heading">
          <div>
            <div className="section-kicker">КАТЕГОРИИ</div>
            <h2>Выбери, что нужно купить</h2>
          </div>
        </div>
        <CategoryGrid />
      </section>

      <section className="kashra-catalog-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">ВСЕ НАПРАВЛЕНИЯ</div>
            <h2>Игры по алфавиту</h2>
          </div>
          <span className="catalog-caption">Быстрый переход по каталогу</span>
        </div>
        <GameCatalog />
      </section>
    </main>
  )
}
