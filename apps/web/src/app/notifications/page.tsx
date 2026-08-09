"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { RequireAuth } from "@/lib/session"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications"
import type { Notification } from "@/lib/types"

const TYPE_LABEL: Record<string, string> = { ORDER: "Заказ", PAYMENT: "Оплата", REVIEW: "Отзыв", SYSTEM: "Система", PROMOTION: "Акция" }

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void listNotifications().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить"))
  }, [])

  async function markRead(n: Notification) {
    if (n.readAt) return
    await markNotificationRead(n.id)
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? null)
  }

  async function readAll() {
    await markAllNotificationsRead()
    setItems((prev) => prev?.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })) ?? null)
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="page-header"><div className="page-kicker">KASHRA</div><h1 className="page-title">Уведомления</h1></div>
        <div className="form-error">{error}</div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Уведомления</h1>
          </div>
          {items && items.length > 0 && (
            <button className="btn-ghost buy-btn" onClick={readAll}>Прочитать все</button>
          )}
        </div>
        {items === null ? (
          <div className="empty-state"><div className="empty-state-title">Загрузка…</div></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Уведомлений нет</div>
            <div>Здесь появятся события по заказам и сделкам.</div>
            <Link href="/catalog" className="empty-state-link">Открыть каталог</Link>
          </div>
        ) : (
          <div className="message-list">
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                className="message-row"
                style={{ width: "100%", textAlign: "left", cursor: "pointer", background: n.readAt ? "transparent" : "var(--surface)" }}
                onClick={() => void markRead(n)}
              >
                <div>
                  <div className="message-title">{TYPE_LABEL[n.type] ?? n.type}</div>
                  <div className="message-meta">{new Date(n.createdAt).toLocaleString("ru-RU")}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}