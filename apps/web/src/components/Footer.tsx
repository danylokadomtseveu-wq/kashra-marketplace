import Link from "next/link"

const socials = [
  ["VK", "https://vk.com/", "vk"],
  ["Telegram", "https://t.me/", "tg"],
  ["Discord", "https://discord.com/", "discord"],
  ["YouTube", "https://youtube.com/", "youtube"],
  ["TikTok", "https://tiktok.com/", "tiktok"],
  ["Instagram", "https://instagram.com/", "instagram"],
] as const

export function Footer() {
  return (
    <footer id="footer" className="kashra-footer">
      <div className="kashra-footer-inner">
        <div className="footer-socials">
          <div className="footer-heading">Мы в соцсетях</div>
          <div className="footer-social-list">
            {socials.map(([label, href, kind]) => (
              <a key={kind} href={href} target="_blank" rel="noreferrer" className={`social social-${kind}`} aria-label={label}>
                {kind === "youtube" ? "▶" : kind === "telegram" ? "➤" : label.slice(0, 2)}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-links">
          <div>
            <div className="footer-heading">Покупателям</div>
            <Link href="/catalog">Каталог</Link>
            <Link href="/orders">Покупки</Link>
            <Link href="/profile">Профиль</Link>
          </div>
          <div>
            <div className="footer-heading">Продавцам</div>
            <Link href="/sell">Продажи</Link>
            <Link href="/profile">Профиль продавца</Link>
            <Link href="/balance">Финансы</Link>
          </div>
          <div>
            <div className="footer-heading">KASHRA</div>
            <Link href="/">Главная</Link>
            <Link href="/messages">Сообщения</Link>
            <Link href="/balance">Баланс</Link>
          </div>
        </div>

        <div className="footer-brand-block">
          <Link href="/" className="footer-brand">KASHRA</Link>
          <p>Маркетплейс игровых товаров и услуг</p>
          <p>© 2026 KASHRA. Все права защищены.</p>
          <p>Покупатель и продавец — один аккаунт.</p>
        </div>
      </div>
    </footer>
  )
}
