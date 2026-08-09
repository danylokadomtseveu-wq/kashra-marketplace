import type { Review } from "@/lib/types"

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewSummary({ reviews }: { reviews: Review[] }) {
  const moderate = reviews.filter((r) => r.moderated)
  const count = moderate.length
  const avg =
    count === 0
      ? 0
      : moderate.reduce((sum, r) => sum + r.rating, 0) / count

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const n = moderate.filter((r) => r.rating === stars).length
    return { stars, n, pct: count === 0 ? 0 : (n / count) * 100 }
  })

  if (!count) {
    return (
      <div className="reviews-summary">
        <div className="reviews-avg">—</div>
        <div className="reviews-meta">ещё нет оценок</div>
      </div>
    )
  }

  return (
    <div className="reviews-summary">
      <div className="reviews-avg">{avg.toFixed(1)} ★</div>
      <div className="reviews-meta">{count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"}</div>
      <div className="reviews-distribution">
        {distribution.map((d) => (
          <div key={d.stars} className="reviews-dist-row">
            <span className="reviews-dist-star">{d.stars} ★</span>
            <div className="reviews-dist-bar">
              <span className="reviews-dist-fill" style={{ width: `${d.pct}%` }} />
            </div>
            <span className="reviews-dist-count">{d.n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReviewList({ reviews }: ReviewListProps) {
  const moderate = reviews.filter((r) => r.moderated)
  if (!moderate.length) {
    return <div className="empty-state">Пока нет опубликованных отзывов</div>
  }
  return (
    <ul className="reviews-list">
      {moderate.map((r) => (
        <li key={r.id} className="review-item">
          <div className="review-author">{r.author?.name ?? "Пользователь"}</div>
          <div className="review-rating">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
          <div className="review-date">
            {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(r.createdAt))}
          </div>
          <div className="review-text">{r.text}</div>
        </li>
      ))}
    </ul>
  )
}
