const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

export interface ApiRequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  auth?: boolean
  skipRefresh?: boolean
  signal?: AbortSignal
}

interface ApiErrorBody {
  error?: { code?: string; message?: string }
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export const AUTH_EXPIRED_EVENT = "auth:expired"

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken(): void {
  accessToken = null
}

function emitAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  }
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): URL {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = response.statusText || `Request failed (${response.status})`
  let code: string | undefined
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body?.error?.message) message = body.error.message
    if (body?.error?.code) code = body.error.code
  } catch {
    // не JSON — оставляем статус-текст
  }
  return new ApiError(response.status, message, code)
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return (await refreshPromise) !== null

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      if (!response.ok) {
        clearAccessToken()
        emitAuthExpired()
        return null
      }
      const data = (await response.json()) as { accessToken?: string }
      if (!data.accessToken) {
        clearAccessToken()
        emitAuthExpired()
        return null
      }
      accessToken = data.accessToken
      return data.accessToken
    } catch {
      clearAccessToken()
      emitAuthExpired()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return (await refreshPromise) !== null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET"
  const withAuth = options.auth ?? true

  const perform = async (): Promise<T> => {
    const headers: Record<string, string> = { ...options.headers }
    const isForm = typeof FormData !== "undefined" && options.body instanceof FormData
    if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json"
    if (withAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch(buildUrl(path, options.query), {
      method,
      credentials: "include",
      headers,
      body: isForm ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })

    if (response.status === 401 && withAuth && !options.skipRefresh) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return perform()
      throw new ApiError(401, "Сессия истекла, войдите снова", "AUTH_EXPIRED")
    }

    if (!response.ok) throw await toApiError(response)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return perform()
}

export function apiGet<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "GET" })
}

export function apiPost<T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "POST" })
}

export function apiPatch<T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "PATCH" })
}

export function apiPut<T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "PUT" })
}

export function apiDelete<T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "DELETE" })
}