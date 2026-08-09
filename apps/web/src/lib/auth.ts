import { apiRequest, setAccessToken, clearAccessToken, AUTH_EXPIRED_EVENT } from "./api"

export interface MeResponse {
  id: string
  email: string
  name: string
  role: string
  status: string
  emailVerifiedAt: string | null
  createdAt: string
}

type Me = MeResponse

export interface AuthResult {
  ok: boolean
  error?: string
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await apiRequest<{ accessToken: string }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    })
    if (!data.accessToken) return { ok: false, error: "Не удалось получить токен" }
    setAccessToken(data.accessToken)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Не удалось войти" }
  }
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    await apiRequest("/auth/register", { method: "POST", auth: false, body: { name, email, password } })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Не удалось зарегистрироваться" }
  }
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST", auth: false, skipRefresh: true })
  } catch {
    // игнорируем сетевые ошибки — токен всё равно стираем на клиенте
  }
  clearAccessToken()
  onAuthExpired()
}

export async function fetchMe(): Promise<Me | null> {
  try {
    return await apiRequest<Me>("/users/me")
  } catch {
    return null
  }
}

export function onAuthExpired(cb?: () => void): void {
  if (typeof window === "undefined") return
  if (cb) {
    window.addEventListener(AUTH_EXPIRED_EVENT, cb)
    return
  }
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}