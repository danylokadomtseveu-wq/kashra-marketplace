"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"
import { createOrder } from "@/lib/orders"
import { RequireAuth } from "@/lib/session"
import type { Product } from "@/lib/types"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get("productId")
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    void apiGet<Product>(`/products/${encodeURIComponent(productId)}`)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить предложение"))
      .finally(() => setLoading(false))
  }, [productId])

  async function placeOrder() {
    if (!product || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const order = await createOrder({
        idempotencyKey: crypto.randomUUID(),
        productId: product.id,
        qty: 1,
      })
      router.replace(`/orders?order=${encodeURIComponent(order.id)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось оформить покупку")
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <div>
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Покупка</h1>
          </div>
          <Link href="/catalog" className="cat-tab">Вернуться к предложениям</Link>
        </div>

        {loading ? (
          <div className="empty-state">Загрузка предложения…</div>
        ) : !productId ? (
          <div className="empty-state">
            <div className="empty-state-title">Выберите предложение</div>
            <div>На KASHRA каждое предложение покупается отдельно — корзины нет.</div>
            <Link href="/catalog" className="empty-state-link">Открыть каталог</Link>
          </div>
        ) : error && !product ? (
          <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>
        ) : product ? (
          <div className="message-list">
            <div className="message-row">
              <div className="order-block">
                <div className="order-top">
                  <div>
                    <div className="message-title">{product.title}</div>
                    <div className="message-meta">Отдельное предложение · количество 1</div>
                  </div>
                  <strong>{Number(product.price).toLocaleString("ru-RU")} ₽</strong>
                </div>
                <div className="form-note" style={{ marginTop: 16 }}>
                  После оплаты заказ появится во вкладке «Покупки». Выполнение сделки и подтверждение получения проходят через заказ.
                </div>
                {error ? <div className="form-error" style={{ marginTop: 12 }}>{error}</div> : null}
                <div className="order-actions" style={{ marginTop: 20 }}>
                  <button className="buy-btn" type="button" disabled={submitting} onClick={() => void placeOrder()}>
                    {submitting ? "Оформляем…" : "Создать заказ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RequireAuth>
  )
}
