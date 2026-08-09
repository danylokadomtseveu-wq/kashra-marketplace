"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getSeller } from "@/lib/sellers"
import { listProducts } from "@/lib/products"
import type { Product, SellerProfile } from "@/lib/types"

export default function SellerPage() {
  const params = useParams<{ id: string }>()
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const s = await getSeller(params.id)
      setSeller(s)
      setError(null)
      try {
        const listed = await listProducts({ sellerId: params.id, availability: "ACTIVE", limit: 50 })
        setProducts(listed)
      } catch {
        setProducts([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Продавец не найден")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    void reload()
  }, [reload])

  if (loading) return <div className="empty-state">Загрузка продавца…</div>
  if (error || !seller) return <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>

  return (
    <div>
      <div className="seller-head">
        <div className="seller-big-avatar">{seller.user?.name?.slice(0, 1) ?? "–"}</div>
        <div>
          <div className="seller-name-big">{seller.user?.name ?? "Продавец"}</div>
          <div className="seller-sub">
            Рейтинг: {Number(seller.ratingCache).toFixed(1)} ★ · Продаж: {seller.salesCount} · на KASHRA с{" "}
            {new Date(seller.user?.createdAt ?? seller.createdAt).toLocaleDateString("ru-RU")}
          </div>
          {seller.description ? <div className="seller-sub" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{seller.description}</div> : null}
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="section-title">Товары продавца</div>
        {products.length === 0 ? (
          <div className="empty-state"><div className="empty-state-title">Товаров пока нет</div><div>Этот продавец ещё не опубликовал лоты.</div></div>
        ) : (
          <div className="message-list">
            {products.map((p) => (
              <div className="message-row" key={p.id}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/products/${p.id}`} className="message-title">{p.title}</Link>
                  <div className="message-meta">{p.category?.name ?? ""} · в наличии: {p.inventory ? (p.inventory.stock - (p.inventory.reserved ?? 0)) : "—"}</div>
                </div>
                <strong>{Number(p.price).toLocaleString("ru-RU")} ₽</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}