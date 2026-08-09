"use client"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/session"
import { listOrders } from "@/lib/orders"
import { createReview } from "@/lib/reviews"
import { ApiError } from "@/lib/api"

interface ReviewFormProps {
  productId: string
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const { status } = useSession()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle")
  const [canReview, setCanReview] = useState<boolean | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    void listOrders()
      .then((orders) => {
        const can = orders.some(
          (o) =>
            o.status === "COMPLETED" &&
            (o.items ?? []).some((it) => it.productId === productId),
        )
        if (!cancelled) setCanReview(can)
      })
      .catch(() => {
        if (!cancelled) setCanReview(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, productId])

  function handleStar(value: number) {
    setRating(value)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (rating < 1) {
      setSubmitError("Выберите оценку")
      return
    }
    if (text.trim().length < 1 || text.trim().length > 2000) {
      setSubmitError("Введите текст отзыва (до 2000 символов)")
      return
    }
    setSubmitting(true)
    try {
      await createReview(productId, { rating, text })
      setSubmitState("success")
      setRating(0)
      setText("")
    } catch (e) {
      const err = e as ApiError
      setSubmitError(err?.message ?? "Не удалось отправить отзыв")
      setSubmitState("idle")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return <div className="form-note">Проверка возможности оставить отзыв…</div>
  }

  if (status === "guest") {
    return (
      <div className="form-note">
        Чтобы оставить отзыв, <a href="/auth/login">войдите</a> или{" "}
        <a href="/auth/register">зарегистрируйтесь</a>.
      </div>
    )
  }

  if (submitState === "success") {
    return (
      <div className="form-note" style={{ color: "var(--green)" }}>
        Ваш отзыв отправлен на модерацию и появится в списке после проверки.
      </div>
    )
  }

  if (canReview === false) {
    return (
      <div className="form-note">
        Оставлять отзывы можно только после покупки этого товара (заказ в статусе «Выполнен»).
      </div>
    )
  }

  if (canReview === null) {
    return <div className="form-note">Проверка покупок…</div>
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-stars">
        <span className="form-label">Оценка</span>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-label={`${v} звёзд`}
              onClick={() => handleStar(v)}
              style={{
                border: "none",
                background: "transparent",
                color: v <= rating ? "#dcae4b" : "var(--text-3)",
                fontSize: 20,
                cursor: "pointer",
              }}
              disabled={submitting}
            >
              {v <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="review-text">
          Текст отзыва
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          className="form-input"
          style={{ resize: "vertical" }}
          disabled={submitting}
        />
      </div>
      {submitError ? <div className="form-error">{submitError}</div> : null}
      <button type="submit" className="buy-btn" disabled={submitting} style={{ marginTop: 8, width: "auto" }}>
        {submitting ? "Отправляем…" : "Отправить на модерацию"}
      </button>
    </form>
  )
}
