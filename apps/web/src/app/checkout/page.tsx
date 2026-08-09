"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getCart, cartTotals } from "@/lib/cart"
import { createOrder } from "@/lib/orders"
import { RequireAuth } from "@/lib/session"
import type { Cart } from "@/lib/types"

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCart()
      setCart(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить корзину")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function placeOrder() {
    if (submitting || !cart || cart.items.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const idempotencyKey = crypto.randomUUID()
      await createOrder({ idempotencyKey, itemIds: cart.items.map((i) => i.id) })
      router.replace("/orders")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось оформить заказ")
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Оформление заказа</h1>
          </div>
          <Link href="/catalog" className="cat-tab">Продолжить покупки</Link>
        </div>

        {loading ? (
          <div className="empty-state">Загрузка корзины…</div>
        ) : error && !cart ? (
          <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>
        ) : cart && cart.items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Корзина пуста</div>
            <div>Добавь товары из каталога, чтобы оформить заказ.</div>
            <Link href="/catalog" className="empty-state-link">Открыть каталог</Link>
          </div>
        ) : cart ? (
          <>
            <div className="cart-list">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-row">
                  <div>
                    <Link href={`/products/${item.product.id}`} className="lot-title">{item.product.title}</Link>
                    <div className="lot-subtitle">
                      {Number(item.product.price).toLocaleString("ru-RU")} ₽ × {item.qty}
                    </div>
                  </div>
                  <span>{(Number(item.product.price) * item.qty).toLocaleString("ru-RU")} ₽</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, alignItems: "center", marginTop: 24 }}>
              <strong>Итого: {cartTotals(cart).total.toLocaleString("ru-RU")} ₽</strong>
              <button className="buy-btn" type="button" disabled={submitting} onClick={() => void placeOrder()}>
                {submitting ? "Оформляем…" : "Подтвердить заказ"}
              </button>
            </div>
            {error ? <div className="form-error" style={{ marginTop: 12, textAlign: "right" }}>{error}</div> : null}
          </>
        ) : null}
      </div>
    </RequireAuth>
  )
}