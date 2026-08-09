"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { listCategories } from "@/lib/catalog"
import { createProduct, deleteProduct } from "@/lib/products"
import { ProductImagesUploader } from "@/components/ProductImagesUploader"
import { getSellerMyProducts, getSellerStats, updateSellerMe } from "@/lib/sellers"
import { RequireAuth, useSession } from "@/lib/session"
import type { Category, Product, ProductImage } from "@/lib/types"

interface FlatCategory {
  id: string
  name: string
  parent: string | null
}

export default function SellPage() {
  const { user, refresh } = useSession()
  const [categories, setCategories] = useState<FlatCategory[]>([])
  const [products, setProducts] = useState<(Product & { inventory?: { stock?: number; reserved?: number } | null; images?: ProductImage[] })[]>([])
  const [stats, setStats] = useState<{ productCount: number; orderCount: number; revenue: string; salesCount: number } | null>(null)
  const [profileForm, setProfileForm] = useState({ name: "", description: "" })
  const [productForm, setProductForm] = useState({ title: "", categoryId: "", price: "", stock: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSeller = user?.role === "SELLER"

  const reload = useCallback(async () => {
    try {
      setError(null)
      const [cats, prod, s] = await Promise.all([
        listCategories(),
        getSellerMyProducts(),
        getSellerStats(),
      ])
      const flat: FlatCategory[] = []
      for (const c of cats as (Category & { children?: Category[] })[]) {
        flat.push({ id: c.id, name: c.name, parent: null })
        for (const ch of c.children ?? []) {
          flat.push({ id: ch.id, name: `${c.name} — ${ch.name}`, parent: c.id })
        }
      }
      setCategories(flat)
      setProducts(prod as (Product & { inventory?: { available?: number; reserved?: number } | null })[])
      setStats(s as { productCount: number; orderCount: number; revenue: string; salesCount: number })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные продавца")
    }
  }, [])

  useEffect(() => {
    if (isSeller) void reload()
  }, [isSeller, reload])

  async function enableSeller(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateSellerMe({ name: profileForm.name || user?.name, description: profileForm.description })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось активировать продавца")
    } finally {
      setSaving(false)
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (!productForm.title || !productForm.categoryId || !productForm.price) {
      setError("Заполни название, категорию и цену")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const slug = slugify(productForm.title)
      await createProduct({
        slug,
        title: productForm.title,
        description: productForm.description,
        categoryId: productForm.categoryId,
        price: Number(productForm.price),
        stock: Number(productForm.stock || 1),
      })
      setProductForm({ title: "", categoryId: "", price: "", stock: "", description: "" })
      await reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось создать товар"
      if (message.toLowerCase().includes("slug") || message.includes("unique")) {
        setError("Название слишком похоже на существующий товар — поменяй его")
      } else {
        setError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    try {
      await deleteProduct(id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить товар")
    }
  }

  return (
    <RequireAuth>
      <div className="sell-form wide">
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Продажи</h1>
          </div>
        </div>

        {!isSeller || !stats ? (
          <form className="form-box" onSubmit={(e) => void enableSeller(e)}>
            <div className="form-field">
              <label className="form-label">Имя продавца</label>
              <input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Как тебя будут видеть покупатели" />
            </div>
            <div className="form-field">
              <label className="form-label">О себе</label>
              <textarea className="form-input" style={{ height: 90, paddingTop: 10, resize: "vertical" }} value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="Опиши, какие товары продаёшь и условия передачи" />
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="buy-btn" type="submit" disabled={saving}>{saving ? "Создаём…" : "Стать продавцом"}</button>
          </form>
        ) : (
          <>
            {stats.orderCount >= 0 ? (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 26 }}>
                <div className="balance-card"><div className="message-meta">Товары</div><div className="balance-amount" style={{ fontSize: 22 }}>{stats.productCount}</div></div>
                <div className="balance-card"><div className="message-meta">Продаж</div><div className="balance-amount" style={{ fontSize: 22 }}>{stats.orderCount}</div></div>
                <div className="balance-card"><div className="message-meta">Выручка</div><div className="balance-amount" style={{ fontSize: 22 }}>{Number(stats.revenue).toLocaleString("ru-RU")} ₽</div></div>
                <div className="balance-card"><div className="message-meta">Продано единиц</div><div className="balance-amount" style={{ fontSize: 22 }}>{stats.salesCount}</div></div>
              </div>
            ) : null}

            <div className="form-box">
              <div className="form-field">
                <label className="form-label">Название товара</label>
                <input className="form-input" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="Например: аккаунт с редким предметом" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Категория</label>
                  <select className="form-input" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                    <option value="">Выбери категорию</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Цена, ₽</label>
                  <input className="form-input" type="number" min="1" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="1000" />
                </div>
                <div className="form-field">
                  <label className="form-label">Количество</label>
                  <input className="form-input" type="number" min="1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="1" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea className="form-input" style={{ height: 120, paddingTop: 10, resize: "vertical" }} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Опиши товар и условия передачи" />
              </div>
              {error ? <div className="form-error">{error}</div> : null}
              <button className="buy-btn" type="submit" disabled={saving} onClick={(e) => void publish(e)}>{saving ? "Публикуем…" : "Опубликовать товар"}</button>
            </div>

            <div style={{ marginTop: 26 }}>
              <div className="section-title">Мои товары</div>
              {products.length === 0 ? (
                <div className="empty-state"><div className="empty-state-title">Пока нет товаров</div><div>Опубликуй первый лот выше.</div></div>
              ) : (
                <div className="message-list">
                  {products.map((p) => (
                    <div className="message-row" key={p.id}>
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/products/${p.id}`} className="message-title">{p.title}</Link>
                        <div className="message-meta">
                          {p.category?.name ?? ""} · {p.inventory ? p.inventory.stock - (p.inventory.reserved ?? 0) : "—"} в наличии · {p.availability}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <strong>{Number(p.price).toLocaleString("ru-RU")} ₽</strong>
                        <button className="cat-tab" onClick={() => void remove(p.id)}>Удалить</button>
                      </div>
                      <ProductImagesUploader productId={p.id} images={p.images} onUpdate={reload} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RequireAuth>
  )
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
  return `${base || "item"}-${Math.random().toString(36).slice(2, 8)}`
}