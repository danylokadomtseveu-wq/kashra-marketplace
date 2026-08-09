"use client"

import { useRef, useState } from "react"
import { deleteProductImage, uploadProductImages } from "@/lib/products"
import type { ProductImage } from "@/lib/types"

interface ProductImagesUploaderProps {
  productId: string
  images: ProductImage[] | undefined
  onUpdate: () => void
}

export function ProductImagesUploader({ productId, images = [], onUpdate }: ProductImagesUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const sorted = images.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))

  async function handleUpload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (!list.length) return
    setError(null)
    setPreview(list.map((f) => URL.createObjectURL(f)))
    setUploading(true)
    try {
      await uploadProductImages(productId, list)
      setPreview([])
      await onUpdate()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить изображение")
    } finally {
      setUploading(false)
    }
  }

  async function remove(imageId: string) {
    try {
      await deleteProductImage(productId, imageId)
      await onUpdate()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить изображение")
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    void handleUpload(e.dataTransfer.files)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="message-meta" style={{ marginBottom: 8 }}>Фото товара ({sorted.length})</div>

      {sorted.length > 0 ? (
        <div className="product-gallery" style={{ marginBottom: 12 }}>
          {sorted.slice(0, 9).map((img) => (
            <div key={img.id} className="gallery-thumb" style={{ position: "relative", display: "grid", placeItems: "stretch" }}>
              <img src={img.url} alt={img.alt ?? "фото"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                className="cat-tab"
                style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px", fontSize: 10 }}
                onClick={() => void remove(img.id)}
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="message-meta" style={{ marginBottom: 12 }}>Добавьте фото, чтобы товар привлекал покупателей</div>
      )}

      {uploading ? (
        <div className="message-meta">Загружаю…</div>
      ) : null}
      {error ? <div className="form-error">{error}</div> : null}

      {preview.length > 0 ? (
        <div className="product-gallery" style={{ marginBottom: 12 }}>
          {preview.map((u) => (
            <img key={u} src={u} alt="preview" className="gallery-thumb" />
          ))}
        </div>
      ) : null}

      <label
        className="buy-btn"
        style={{ display: "inline-flex", cursor: "pointer", padding: "8px 14px", fontSize: 13, opacity: uploading ? 0.6 : 1 }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <span style={{ marginRight: 6 }}>📎</span>
        {uploading ? "Загрузка…" : drag ? "Отпустите файлы" : "+ Фото"}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={inputRef}
          disabled={uploading}
          onChange={(e) => void handleUpload(e.target.files ?? [])}
        />
      </label>
    </div>
  )
}
