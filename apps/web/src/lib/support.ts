import { apiGet, apiPost } from "./api"

export interface SupportTicket {
  id: string
  userId: string
  type: string
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export async function listTickets(): Promise<SupportTicket[]> {
  return apiGet<SupportTicket[]>("/support/tickets")
}

export async function createTicket(input: { subject: string; message: string; orderId?: string }): Promise<SupportTicket> {
  return apiPost<SupportTicket>("/support/tickets", { body: input })
}

export async function getTicket(ticketId: string): Promise<SupportTicket> {
  return apiGet<SupportTicket>(`/support/tickets/${ticketId}`)
}

export async function replyTicket(ticketId: string, message: string): Promise<SupportTicket> {
  return apiPost<SupportTicket>(`/support/tickets/${ticketId}/reply`, { body: { message } })
}