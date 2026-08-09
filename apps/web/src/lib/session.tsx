"use client"
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { fetchMe, logout, login as loginCall, onAuthExpired, type MeResponse } from "./auth"
import { mergeCart } from "./cart"
import { setAccessToken } from "./api"

export type SessionStatus = "loading" | "authenticated" | "guest"

interface SessionValue {
  status: SessionStatus
  user: MeResponse | null
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  setUser: (user: MeResponse | null) => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading")
  const [user, setUser] = useState<MeResponse | null>(null)

  const refresh = useCallback(async () => {
    setStatus("loading")
    const me = await fetchMe()
    setUser(me)
    setStatus(me ? "authenticated" : "guest")
  }, [])

  useEffect(() => {
    void refresh()
    return onAuthExpired(() => {
      setUser(null)
      setStatus("guest")
    })
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginCall(email, password)
    if (result.ok) {
      try {
        // переносим гостевую корзину в аккаунт
        await mergeCart()
      } catch {
        // слияние не критично — корзина останется у пользователя после следующей сессии
      }
      const me = await fetchMe()
      setUser(me)
      setStatus(me ? "authenticated" : "guest")
    }
    return result
  }, [])

  const doLogout = useCallback(async () => {
    await logout()
    setUser(null)
    setStatus("guest")
    setAccessToken(null)
  }, [])

  return (
    <SessionContext.Provider value={{ status, user, refresh, login, logout: doLogout, setUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession должен использоваться внутри SessionProvider")
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "guest") {
      router.replace("/auth/login")
    }
  }, [status, router])

  if (status === "loading" || status === "guest") {
    return <div className="page-kicker">Загрузка…</div>
  }
  return <>{children}</>
}