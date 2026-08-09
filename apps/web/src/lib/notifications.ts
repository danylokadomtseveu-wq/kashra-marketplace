import { apiGet, apiPatch, apiPost } from "./api"
import type { Notification } from "@/lib/types"

export async function listNotifications(unreadOnly = false): Promise<Notification[]> {
  return apiGet<Notification[]>("/notifications", {
    query: { unread: unreadOnly ? "true" : undefined },
  })
}

export function notificationLabel(n: Notification): string {
  const labels: Record<string, string> = {
    ORDER: "Заказ",
    PAYMENT: "Оплата",
    REVIEW: "Отзыв",
    SYSTEM: "Система",
    PROMOTION: "Акция",
  }
  return labels[n.type] ?? n.type
}

export function notificationLink(n: Notification): string {
  const payload = (n.payload ?? {}) as Record<string, unknown>
  if (payload.orderId) return `/orders/${String(payload.orderId)}`
  if (payload.productId) return `/products/${String(payload.productId)}`
  if (payload.ticket === true) return `/messages`
  return `/notifications`
}

export function notificationMeta(n: Notification): string {
  const payload = (n.payload ?? {}) as Record<string, unknown>
  const subject = payload.subject
  return typeof subject === "string" && subject.length > 0 ? subject : ""
}

export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated"

export function emitNotificationsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
  }
}

export async function unreadCount(): Promise<number> {
  return apiGet<number>("/notifications/unread-count")
}

export async function markNotificationRead(id: string): Promise<{ count: number }> {
  return apiPatch<{ count: number }>(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  return apiPost<{ count: number }>("/notifications/read-all")
}