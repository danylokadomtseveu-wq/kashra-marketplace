"use client"

import { useState } from "react"
import Link from "next/link"

export function ProductActions({ product }: { product: { id: string; title: string; price: string } }) {
  const [added, setAdded] = useState(false)

  function addToCart() {
    const current = JSON.parse(localStorage.getItem("kashra-cart") ?? "[]") as Array<{id:string;title:string;price:string;qty:number}>
    const existing = current.find((item) => item.id === product.id)
    if (existing) existing.qty += 1
    else current.push({ id: product.id, title: product.title, price: product.price, qty: 1 })
    localStorage.setItem("kashra-cart", JSON.stringify(current))
    setAdded(true)
  }

  return (
    <div className="product-actions">
      <Link href={`/products/${product.id}`} className="buy-btn" onClick={addToCart}>Купить</Link>
      <button type="button" className="header-btn btn-ghost" onClick={addToCart}>{added ? "В корзине" : "В корзину"}</button>
    </div>
  )
}
