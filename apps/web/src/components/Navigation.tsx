"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/session"
import { getWallet } from "@/lib/wallet"
import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadCount, notificationLabel, notificationLink, notificationMeta, emitNotificationsUpdated, NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications"
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
    void unreadCount().then(setUnread).catch(() => undefined)
  }

  useEffect(() => {
    if (status !== "authenticated") return
    void getWallet().then((wallet) => setBalance(Number(wallet.available).toLocaleString("ru-RU"))).catch(() => undefined)
    refreshUnread()
    const onUpdate = () => refreshUnread()
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate)
  }, [status])

  async function openMenu() {
    setMenuOpen(true)
    if (status !== "authenticated" || recent.length) return
    setRecentLoading(true)
    try { setRecent((await listNotifications()).slice(0, 8)) } catch { setRecent([]) } finally { setRecentLoading(false) }
  }

  async function markRead(notification: Notification) {
    if (notification.readAt) return
    try {
      await markNotificationRead(notification.id)
      setRecent((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
      setUnread((value) => Math.max(0, value - 1))
      emitNotificationsUpdated()
    } catch {}
  }

  async function readAll() {
    try {
      await markAllNotificationsRead()
      setRecent((items) => items.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() }))
      setUnread(0)
      emitNotificationsUpdated()
    } catch {}
  }

  async function handleLogout(event: React.MouseEvent) {
    event.preventDefault()
    await logout()
    window.location.href = "/"
  }

  const authed = status === "authenticated"
  const initial = user?.name?.[0]?.toUpperCase() ?? "П"

  return (
    <div className="nav-container">
      <nav className="navbar-collapse" aria-label="Основная навигация">
        <ul className="nav navbar-nav navbar-right">
          {authed ? (
            <>
              <li className="nav-item"><Link href="/orders">Покупки</Link></li>
              <li className="nav-item"><Link href="/sell">Продажи</Link></li>
              <li className="nav-item"><Link href="/messages">Сообщения{unread > 0 ? ` ${unread > 9 ? "9+" : unread}` : ""}</Link></li>
              <li className="nav-item"><Link href="/balance">Финансы</Link></li>
              <li className="nav-item nav-meta"><Link href="/balance" className="header-meta">{balance !== null ? `${balance} ₽` : "Баланс"}</Link></li>
              <li className="nav-item nav-meta">
                <button type="button" className="header-meta nav-bell" aria-label="Уведомления" aria-expanded={menuOpen} onClick={() => void (menuOpen ? setMenuOpen(false) : openMenu())}>♢{unread > 0 ? <span className="nav-badge">{unread > 9 ? "9+" : unread}</span> : null}</button>
                {menuOpen ? (
                  <div className="nav-notif-panel" onMouseLeave={() => setMenuOpen(false)}>
                    {recentLoading ? <div className="nav-notif-item">Загрузка…</div> : recent.length === 0 ? <div className="nav-notif-item nav-notif-empty">Нет уведомлений</div> : recent.map((notification) => (
                      <Link key={notification.id} href={notificationLink(notification)} className="nav-notif-item" onClick={() => void markRead(notification)}>
                        <div className="nav-notif-title">{notificationLabel(notification)}</div>
                        {notificationMeta(notification) ? <div className="nav-notif-meta">{notificationMeta(notification)}</div> : null}
                        <div className="message-meta">{new Date(notification.createdAt).toLocaleString("ru-RU")}</div>
                      </Link>
                    ))}
                    {recent.length > 0 ? <div className="nav-notif-foot"><button type="button" className="btn-ghost" style={{ width: "100%" }} onClick={() => void readAll()}>Прочитать все</button></div> : null}
                  </div>
                ) : null}
              </li>
              <li className="nav-item nav-avatar"><Link href="/profile" className="seller-avatar" aria-label={`Профиль: ${user?.name ?? ""}`}>{initial}</Link></li>
              <li className="nav-item"><button type="button" className="header-meta" onClick={handleLogout}>Выйти</button></li>
            </>
          ) : (
            <>
              <li className="nav-item"><Link href="/help">Помощь</Link></li>
              <li className="nav-item"><Link href="/auth/login" className={status === "loading" ? "nav-muted" : ""}>Войти</Link></li>
              <li className="nav-item"><Link href="/auth/register" className="nav-register">Регистрация</Link></li>
            </>
          )}
        </ul>
      </nav>
    </div>
  )
}
