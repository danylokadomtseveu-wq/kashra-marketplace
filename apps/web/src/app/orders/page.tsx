"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { cancelOrder, confirmOrder, listOrders, payOrder } from "@/lib/orders"
import { RequireAuth } from "@/lib/session"
import type { Order } from "@/lib/types"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setOrders(await listOrders())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить покупки")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  async function act(id: string, action: (id: string) => Promise<Order>) {
    if (busy) return
    setBusy(id)
    try { await action(id); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось выполнить действие") }
    finally { setBusy(null) }
  }

  return (
    <RequireAuth>
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Покупки</h1>
          </div>
          <Link href="/catalog" className="cat-tab">Найти предложение</Link>
        </div>

        {loading ? <div className="empty-state">Загрузка покупок…</div> : error && orders.length === 0 ? (
          <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Покупок пока нет</div>
            <div>Выберите предложение в каталоге и купите его напрямую. Корзины на KASHRA нет.</div>
            <Link href="/catalog" className="empty-state-link">Открыть каталог</Link>
          </div>
        ) : (
          <>
            {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}
            <div className="message-list">
              {orders.map((o) => (
                <div className="message-row" key={o.id}>
                  <div className="order-block">
                    <div className="order-top">
                      <div>
                        <div className="message-title">{o.id.slice(0, 8).toUpperCase()}</div>
                        <div className="message-meta">{new Date(o.createdAt).toLocaleString("ru-RU")} · {o.itemsSummary.itemCount ?? (o.items?.length ?? 0)} позиция · {statusLabel(o.status)}</div>
                      </div>
                      <strong>{Number(o.total).toLocaleString("ru-RU")} ₽</strong>
                    </div>
                    {o.items?.length ? <div className="order-items">{o.items.map((it) => <div key={it.id} className="message-meta">{it.title} × {it.qty}</div>)}</div> : null}
                    {o.status === "PENDING_PAYMENT" ? (
                      <div className="order-actions">
                        <button className="buy-btn" type="button" disabled={busy === o.id} onClick={() => void act(o.id, payOrder)}>{busy === o.id ? "Оплачиваем…" : "Оплатить"}</button>
                        <button className="header-btn btn-ghost" type="button" disabled={busy === o.id} onClick={() => void act(o.id, cancelOrder)}>Отменить</button>
                      </div>
                    ) : o.status === "DELIVERED" ? (
                      <div className="order-actions"><button className="buy-btn" type="button" disabled={busy === o.id} onClick={() => void act(o.id, confirmOrder)}>{busy === o.id ? "Подтверждаем…" : "Получил услугу / товар"}</button></div>
                    ) : o.status === "COMPLETED" && o.items?.length ? (
                      <div className="order-actions">{o.items.map((it) => <Link key={it.id} href={`/products/${it.productId}`} className="header-btn btn-ghost" style={{ minWidth: 160, justifyContent: "center" }}>Оставить отзыв</Link>)}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </RequireAuth>
  )
}

function statusLabel(status: Order["status"]) {
  switch (status) {
    case "PENDING_PAYMENT": return "Ожидает оплаты"
    case "PAID": return "Оплачен"
    case "IN_PROGRESS": return "В работе"
    case "DELIVERED": return "Готово к подтверждению"
    case "CONFIRMED": return "Подтверждён"
    case "COMPLETED": return "Завершён"
    case "CANCELLED": return "Отменён"
    case "REFUNDED": return "Возврат средств"
    case "DISPUTED": return "Спор"
    default: return status
  }
}
