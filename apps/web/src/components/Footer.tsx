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
            <Link href="/help">Гарантии</Link>
            <Link href="/help">Безопасность</Link>
            <Link href="/catalog">Как купить</Link>
            <Link href="/reviews">Отзывы</Link>
          </div>
          <div>
            <div className="footer-heading">Продавцам</div>
            <Link href="/sell">Как продавать</Link>
            <Link href="/help">Правила</Link>
            <Link href="/profile">Рейтинг продавцов</Link>
            <Link href="/balance">Выплаты</Link>
          </div>
          <div>
            <div className="footer-heading">О проекте</div>
            <Link href="/about">О нас</Link>
            <Link href="/contacts">Контакты</Link>
            <Link href="/news">Новости</Link>
            <Link href="/support">Сотрудничество</Link>
          </div>
        </div>

        <div className="footer-brand-block">
          <Link href="/" className="footer-brand">KASHRA</Link>
          <p>Маркетплейс игровых товаров и услуг</p>
          <p>© 2026 KASHRA. Все права защищены.</p>
          <Link href="/terms">Пользовательское соглашение</Link>
          <Link href="/privacy">Политика конфиденциальности</Link>
        </div>
      </div>
    </footer>
  )
}
