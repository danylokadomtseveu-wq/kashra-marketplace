"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export function SearchBox() {
  const router = useRouter()
  const [q, setQ] = useState("")

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const query = q.trim()
    if (query) router.push(`/catalog?query=${encodeURIComponent(query)}`)
  }

  return (
    <form className="post-search navbar-left" onSubmit={onSubmit} role="search">
      <div className="form-group">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="form-control search-input"
          placeholder="Поиск по 120 играм"
          autoComplete="off"
        />
      </div>
      <button type="submit" className="btn btn-link" aria-label="Найти">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </form>
  )
}