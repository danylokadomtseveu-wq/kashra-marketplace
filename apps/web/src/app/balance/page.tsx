"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { formatMoney, getWallet, topUpWallet } from "@/lib/wallet"
import { RequireAuth } from "@/lib/session"
import type { WalletBalance } from "@/lib/types"

export default function BalancePage() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setWallet(await getWallet())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить баланс")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function topUp(amount: number) {
    if (busy !== null) return
    setBusy(amount)
    try {
      setWallet(await topUpWallet(amount, crypto.randomUUID()))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось пополнить баланс")
    } finally {
      setBusy(null)
    }
  }

  return (
    <RequireAuth>
      <div className="sell-form">
        <div className="page-header">
          <div>
            <div className="page-kicker">KASHRA</div>
            <h1 className="page-title">Баланс</h1>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Загрузка баланса…</div>
        ) : wallet ? (
          <>
            <div className="balance-card">
              <div className="message-meta">Доступно</div>
              <div className="balance-amount">{formatMoney(wallet.available)} ₽</div>
              {Number(wallet.frozen) > 0 ? <div className="message-meta">Заморожено: {formatMoney(wallet.frozen)} ₽</div> : null}
            </div>
            <div className="form-box" style={{ marginTop: 22 }}>
              <div className="form-field">
                <label className="form-label">Пополнить</label>
                <div className="balance-actions">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button key={v} type="button" className="btn-ghost buy-btn" disabled={busy !== null} onClick={() => void topUp(v)}>
                      +{v.toLocaleString("ru-RU")} ₽
                    </button>
                  ))}
                </div>
              </div>
              {error ? <div className="form-error">{error}</div> : null}
              <div className="sell-help">
                Пополнение зачисляется на кошелёк мгновенно (демо-провайдер WALLET). Средства используются при оплате заказа.
              </div>
            </div>
          </>
        ) : error ? (
          <div className="empty-state"><div className="empty-state-title">Ошибка</div><div>{error}</div></div>
        ) : null}

        <div className="form-note">
          <Link href="/orders">Мои покупки</Link> · <Link href="/sell">Продать товар</Link>
        </div>
      </div>
    </RequireAuth>
  )
}