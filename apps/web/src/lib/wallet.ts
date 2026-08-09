import { apiGet, apiPost } from "./api"
import type { WalletBalance } from "./types"

export async function getWallet(): Promise<WalletBalance> {
  return apiGet<WalletBalance>("/wallet")
}

export async function topUpWallet(amount: number, idempotencyKey: string): Promise<WalletBalance> {
  return apiPost<WalletBalance>("/wallet/top-up", { body: { amount, idempotencyKey } })
}

export function formatMoney(value: string | number): string {
  return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 })
}