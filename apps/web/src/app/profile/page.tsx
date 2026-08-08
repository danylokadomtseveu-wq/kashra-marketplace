"use client"

import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()

  function logout() {
    document.cookie = "__access__=; path=/; max-age=0"
    router.push("/")
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Профиль</h1>
      </div>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Пользователь</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>user@example.com</div>
          </div>
          <button onClick={logout} className="buy-btn btn-orange" style={{ fontSize: 12, padding: "6px 14px" }}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
