"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/session"
import { addFavorite, removeFavorite } from "@/lib/favorites"
import type { ApiError } from "@/lib/api"

export function FavoriteButton({
  productId,
  initial = false,
  size = 18,
}: {
  productId: string
  initial?: boolean
  size?: number
}) {
  const { status, login } = useSession()
  const router = useRouter()
  const [active, setActive] = useState(initial)
  const [busy, setBusy] = useState(false)

  if (status === "loading") {
    return (
      <button
        type="button"
        aria-label="Избранное"
        style={{ width: size, height: size, opacity: 0.4 }}
      />
    )
  }

  async function toggle() {
    if (status === "guest") {
      router.replace("/auth/login")
      return
    }
    if (busy) return
    setBusy(true)
    const next = !active
    setActive(next)
    try {
      if (next) {
        await addFavorite(productId)
      } else {
        await removeFavorite(productId)
      }
    } catch (e) {
      setActive((v) => !v)
      const err = e as ApiError
      if (err?.status === 401) {
        if (login) {
          await login("", "")
        } else {
          router.replace("/auth/login")
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const filled = active ? "#ef6464" : "transparent"
  const stroke = active ? "#ef6464" : "#b7bec9"
  return (
    <button
      type="button"
      aria-label="Избранное"
      disabled={busy}
      onClick={() => void toggle()}
      style={{
        width: size + 6,
        height: size + 6,
        padding: 1,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        opacity: busy ? 0.5 : 1,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={filled} stroke={stroke} strokeWidth={1.6} aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
