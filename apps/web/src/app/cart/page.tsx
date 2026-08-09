"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { getCart, updateCartItem, removeCartItem, cartTotals } from "@/lib/cart"
import type { Cart } from "@/lib/types"

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  async function changeQty(itemId: string, qty: number) {
    try {
      const data = qty <= 0 ? await removeCartItem(itemId) : await updateCartItem(itemId, qty)
      setCart(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось изменить количество")
    }
  }

  async function remove(itemId: string) {
    try {
      const data = await removeCartItem(itemId)
      setCart(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить товар")
    }
  }

  if (loading) {
    return <div className="empty-state">Загрузка корзины…</div>
  }

  if (error) {
    return <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>
  }

  const items = cart?.items ?? []
  const total = cart ? cartTotals(cart).total : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">KASHRA</div>
          <h1 className="page-title">Корзина</h1>
        </div>
        <Link href="/catalog" className="cat-tab">Продолжить покупки</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Корзина пуста</div>
          <div>Добавь товары из каталога, чтобы оформить заказ.</div>
          <Link href="/catalog" className="empty-state-link">Открыть каталог</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <div key={item.id} className="cart-row">
                <div>
                  <Link href={`/products/${item.product.id}`} className="lot-title">{item.product.title}</Link>
                  <div className="lot-subtitle">{Number(item.product.price).toLocaleString("ru-RU")} ₽ за штуку</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button className="header-btn btn-ghost" onClick={() => void changeQty(item.id, item.qty - 1)}>−</button>
                  <span>{item.qty}</span>
                  <button className="header-btn btn-ghost" onClick={() => void changeQty(item.id, item.qty + 1)}>+</button>
                  <button className="cat-tab" onClick={() => void remove(item.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, alignItems: "center", marginTop: 24 }}>
            <strong>Итого: {total.toLocaleString("ru-RU")} ₽</strong>
            <Link href="/checkout" className="buy-btn">Оформить заказ</Link>
          </div>
        </>
      )}
    </div>
  )
}