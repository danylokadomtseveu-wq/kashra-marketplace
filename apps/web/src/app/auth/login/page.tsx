"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error?.message ?? "Ошибка входа")
        return
      }

      const data = await res.json()
      document.cookie = `__access__=${data.accessToken}; path=/; max-age=900`
      router.push("/")
      router.refresh()
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto" }}>
      <h2 style={{
        fontFamily: "var(--font-heading)",
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 24,
        textAlign: "center",
      }}>
        Вход в <span style={{ color: "var(--green)" }}>KASHRA</span>
      </h2>

      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 20,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                height: 36,
                padding: "0 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 4, fontWeight: 600 }}>
              Пароль
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                height: 36,
                padding: "0 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            className="buy-btn"
            disabled={loading}
            style={{
              width: "100%",
              height: 38,
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 16, color: "var(--text-3)", fontSize: 12, textAlign: "center" }}>
        Нет аккаунта? <Link href="/auth/register">Зарегистрироваться</Link>
      </p>
    </div>
  )
}
