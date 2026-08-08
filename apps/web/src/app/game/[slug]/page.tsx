import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

const GAME_CATEGORIES: Record<string, { slug: string; title: string; items: { name: string; slug: string }[] }> = {
  "cs2": { slug: "cs2", title: "Counter-Strike 2", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Prime статус", slug: "prime" },
    { name: "FACEIT Premium", slug: "faceit" },
    { name: "The Armory", slug: "armory" },
    { name: "Скины", slug: "skins" },
    { name: "Контейнеры", slug: "containers" },
    { name: "Бустинг", slug: "boosting" },
    { name: "Коучинг", slug: "coaching" },
    { name: "Прочее", slug: "other" },
  ]},
  "dota-2": { slug: "dota-2", title: "Dota 2", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Буст MMR", slug: "boosting" },
    { name: "Калибровка", slug: "calibration" },
    { name: "Предметы", slug: "items" },
    { name: "Услуги", slug: "services" },
  ]},
  "valorant": { slug: "valorant", title: "Valorant", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Буст рейтинга", slug: "boosting" },
    { name: "Боевой пропуск", slug: "battlepass" },
    { name: "Скины", slug: "skins" },
    { name: "Коучинг", slug: "coaching" },
    { name: "Прочее", slug: "other" },
  ]},
  "gta-5": { slug: "gta-5", title: "GTA V", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Деньги", slug: "money" },
    { name: "Предметы", slug: "items" },
    { name: "Услуги", slug: "services" },
    { name: "Прочее", slug: "other" },
  ]},
  "rust": { slug: "rust", title: "Rust", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Предметы", slug: "items" },
    { name: "Скины", slug: "skins" },
    { name: "Услуги", slug: "services" },
    { name: "Прочее", slug: "other" },
  ]},
  "minecraft": { slug: "minecraft", title: "Minecraft", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Монеты", slug: "coins" },
    { name: "Предметы", slug: "items" },
    { name: "Услуги", slug: "services" },
  ]},
  "fortnite": { slug: "fortnite", title: "Fortnite", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "V-Bucks", slug: "vbucks" },
    { name: "Скины", slug: "skins" },
    { name: "Услуги", slug: "services" },
  ]},
  "pubg": { slug: "pubg", title: "PUBG", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "UC", slug: "uc" },
    { name: "Предметы", slug: "items" },
    { name: "Бустинг", slug: "boosting" },
    { name: "Прочее", slug: "other" },
  ]},
  "apex-legends": { slug: "apex-legends", title: "Apex Legends", items: [
    { name: "Аккаунты", slug: "accounts" },
    { name: "Монеты", slug: "coins" },
    { name: "Бустинг", slug: "boosting" },
    { name: "Коучинг", slug: "coaching" },
    { name: "Прочее", slug: "other" },
  ]},
  "path-of-exile": { slug: "path-of-exile", title: "Path of Exile 2", items: [
    { name: "Орбы", slug: "orbs" },
    { name: "Аккаунты", slug: "accounts" },
    { name: "Предметы", slug: "items" },
    { name: "Услуги", slug: "services" },
    { name: "Прочее", slug: "other" },
  ]},
}

// Генерируем демо-лоты
function generateLots(category: string, gameSlug: string) {
  const sellers = ["ProGamer", "BestDeal", "TopSeller", "FastBoost", "EliteShop", "GameMaster", "QuickSale", "PrimeLot"]
  const lots = []
  for (let i = 0; i < 12; i++) {
    const seller = sellers[i % sellers.length]
    const price = Math.floor(Math.random() * 5000 + 100)
    const rating = (4 + Math.random()).toFixed(1)
    const online = Math.random() > 0.3
    const stock = Math.floor(Math.random() * 20 + 1)
    lots.push({
      id: `${gameSlug}-${category}-${i}`,
      seller: { name: seller, rating: parseFloat(rating), online },
      title: `${category} — лот #${i + 1}`,
      subtitle: `${gameSlug.toUpperCase()} • Быстрая доставка`,
      price: price.toFixed(2),
      stock,
    })
  }
  return lots
}

async function fetchProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = GAME_CATEGORIES[slug] ?? { slug, title: slug, items: [{ name: "Все лоты", slug: "all" }] }
  const lots = generateLots("all", slug)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">Главная</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/catalog">Все игры</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{game.title}</span>
      </div>

      <div className="home-layout">
        {/* Left sidebar — categories */}
        <aside className="home-panel">
          <div className="home-panel-title">{game.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {game.items.map((item) => (
              <Link key={item.slug} href={`/game/${slug}/${item.slug}`} style={{ padding: "6px 10px", borderRadius: 3, fontSize: 12 }}>
                {item.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Right — lot table */}
        <section>
          <div className="page-header">
            <h1 className="page-title">{game.title} — Все лоты</h1>
            <div className="cat-tabs">
              <Link href={`/game/${slug}`} className="cat-tab active">Все</Link>
              {game.items.slice(0, 5).map((item) => (
                <Link key={item.slug} href={`/game/${slug}/${item.slug}`} className="cat-tab">{item.name}</Link>
              ))}
            </div>
          </div>

          <table className="lot-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Продавец</th>
                <th>Товар</th>
                <th style={{ width: "10%" }}>Наличие</th>
                <th style={{ width: "12%", textAlign: "right" }}>Цена</th>
                <th style={{ width: "90px" }}></th>
              </tr>
            </thead>
            <tbody>
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#9aa2aa" }}>
                    Нет предложений в этой категории
                  </td>
                </tr>
              ) : (
                lots.map((lot) => (
                  <tr key={lot.id}>
                    <td>
                      <div className="seller-cell">
                        <div className="seller-avatar">
                          {(lot.seller.name ?? "?")[0]}
                        </div>
                        <div>
                          <div className="seller-name">{lot.seller.name}</div>
                          <div className="seller-rating">
                            ★ {lot.seller.rating.toFixed(1)}
                            <span className={`seller-status ${lot.seller.online ? "online" : "offline"}`} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link href={`/products/${lot.id}`}>
                        <div className="lot-title">{lot.title}</div>
                        <div className="lot-subtitle">{lot.subtitle}</div>
                      </Link>
                    </td>
                    <td>
                      <span className={`lot-qty ${lot.stock < 3 ? "lot-qty-low" : ""}`}>
                        {lot.stock}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="lot-price">
                        {parseFloat(lot.price).toLocaleString("ru-RU")} ₽
                      </span>
                    </td>
                    <td>
                      <button className="buy-btn">Купить</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
