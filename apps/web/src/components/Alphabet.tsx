"use client"

import { useEffect, useRef, useState } from "react"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function Alphabet({ available, active }: { available: Set<string>; active: string }) {
  const [fixed, setFixed] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const top = el.offsetTop
    const onScroll = () => setFixed(window.scrollY > top - 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className={`nav-abc ${fixed ? "affix" : ""}`} id="nav-abc" ref={ref}>
      <ul>
        {LETTERS.map((l) => {
          const has = available.has(l)
          return (
            <li key={l} className={active === l ? "active" : ""}>
              <a
                href={has ? `#letter-${l}` : undefined}
                onClick={(e) => {
                  if (!has) return
                  const el = document.getElementById(`letter-${l}`)
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                  e.preventDefault()
                }}
                className={has ? "" : "empty"}
                aria-disabled={!has}
              >
                {l}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}