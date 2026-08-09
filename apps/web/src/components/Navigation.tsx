"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/session"
import { getWallet } from "@/lib/wallet"
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
  notificationLabel,
  notificationLink,
  notificationMeta,
  emitNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications"
import type { Notification } from "@/lib/types"

export function Navigation() {
  const { status, user, logout } = useSession()
  const [balance, setBalance] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [recent, setRecent] = useState<Notification[]>([])
  const [recentLoading, setRecentLoading] = useState(false)

  const refreshUnread = () => {
    if (status !== "authenticated") return
    void unreadCount().then((n) => setUnread(n)).catch(() => undefined)
  }

  useEffect(() => {
    if (status !== "authenticated") return
    void getWallet()
      .then((w) => setBalance(Number(w.available).toLocaleString("ru-RU")))
      .catch(() => undefined)
    refreshUnread()
    const onUpdate = () => refreshUnread()
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
  }, [status])

  async function openMenu() {
    setMenuOpen(true)
    if (status === "authenticated" && recent.length === 0) {
      setRecentLoading(true)
      try {
        const list = await listNotifications()
        setRecent(list.slice(0, 8))
      } catch {
        // оставляем пустым
      } finally {
        setRecentLoading(false)
      }
    }
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  async function markRead(n: Notification) {
    if (n.readAt) return
    try {
      await markNotificationRead(n.id)
      setRecent((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)))
      setUnread((prev) => Math.max(0, prev - 1))
      emitNotificationsUpdated()
    } catch {
      // игнорируем ошибку пометки — UI обновится при следующем fetch
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead()
      setRecent((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })))
      setUnread(0)
      emitNotificationsUpdated()
    } catch {
      // игнорируем
    }
  }

  const authed = status === "authenticated"
  const initial = user?.name?.[0]?.toUpperCase() ?? "П"

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault()
    await logout()
    window.location.href = "/"
  }

  return (
    <div className="nav-container">
      <nav className="navbar-collapse" aria-label="Основная навигация">
        <ul className="nav navbar-nav navbar-right">
          {authed ? (
            <>
              <li className="nav-item"><Link href="/orders">Покупки</Link></li>
              <li className="nav-item"><Link href="/favorites">Избранное</Link></li>
              <li className="nav-item"><Link href="/sell">Продажи</Link></li>
              <li className="nav-item nav-meta">
                <Link href="/balance" className="header-meta">{balance !== null ? `${balance} ₽` : "Баланс"}</Link>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className="header-meta nav-bell"
                  aria-label="Уведомления"
                  aria-expanded={menuOpen}
                  onClick={() => void (menuOpen ? closeMenu() : openMenu())}
                >
                  🔔{unread > 0 ? <span className="nav-badge">{unread > 9 ? "9+" : unread}</span> : null}
                </button>
                {menuOpen ? (
                  <div className="nav-notif-panel" onMouseLeave={closeMenu}>
                    {recentLoading ? (
                      <div className="nav-notif-item">Загрузка…</div>
                    ) : recent.length === 0 ? (
                      <div className="nav-notif-item nav-notif-empty">Нет уведомлений</div>
                    ) : (
                      recent.map((n) => (
                        <Link
                          key={n.id}
                          href={notificationLink(n)}
                          className="nav-notif-item"
                          style={{ background: n.readAt ? "transparent" : "var(--surface)" }}
                          onClick={() => void markRead(n)}
                        >
                          <div className="nav-notif-title">{notificationLabel(n)}</div>
                          {notificationMeta(n) ? <div className="nav-notif-meta">{notificationMeta(n)}</div> : null}
                          <div className="message-meta">{new Date(n.createdAt).toLocaleString("ru-RU")}</div>
                        </Link>
                      ))
                    )}
                    {recent.length > 0 && (
                      <div className="nav-notif-foot">
                        <button type="button" className="btn-ghost" style={{ width: "100%" }} onClick={() => void readAll()}>
                          Прочитать все
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
              <li className="nav-item nav-avatar">
                <Link href="/profile" className="seller-avatar" aria-label={`Профиль: ${user?.name ?? ""}`}>{initial}</Link>
              </li>
              <li className="nav-item"><button type="button" className="header-meta" onClick={handleLogout}>Выйти</button></li>
            </>
          ) : (
            <>
              <li className="nav-item"><Link href="/auth/login" className={status === "loading" ? "nav-muted" : ""}>Войти</Link></li>
              <li className="nav-item"><Link href="/auth/register" className="nav-register">Зарегистрироваться</Link></li>
              <li className="nav-item nav-meta"><button type="button" className="header-meta">По-русски</button></li>
              <li className="nav-item nav-meta"><button type="button" className="header-meta">Рубли</button></li>
            </>
          )}
        </ul>
      </nav>
    </div>
  )
}
