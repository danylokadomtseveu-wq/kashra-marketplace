"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ProductActions({ product }: { product: { id: string; title: string; price: string } }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function buy() {
    if (busy) return
    setBusy(true)
    setError(null)
    router.push(`/checkout?productId=${encodeURIComponent(product.id)}`)
  }

  return (
    <div className="product-actions">
      <button className="buy-btn" type="button" disabled={busy} onClick={buy}>
        {busy ? "Открываем…" : "Купить"}
      </button>
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  )
}
