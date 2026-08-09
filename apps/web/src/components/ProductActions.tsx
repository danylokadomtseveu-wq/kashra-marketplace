"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { addToCart } from "@/lib/cart"
export function ProductActions({ product }: { product: { id: string; title: string; price: string } }) {
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function add() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await addToCart(product.id, null, 1)
      setAdded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить в корзину")
    } finally {
      setBusy(false)
    }
  }

  async function buy() {
    await add()
    if (!error) router.push("/cart")
  }

  return (
    <div className="product-actions">
      <button className="buy-btn" type="button" disabled={busy} onClick={() => void buy()}>Купить</button>
      <button className="header-btn btn-ghost" type="button" disabled={busy} onClick={() => void add()}>
        {added ? "В корзине ✓" : busy ? "Добавляем…" : "В корзину"}
      </button>
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  )
}