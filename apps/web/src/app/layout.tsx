import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import "./globals.css"

export const metadata = {
  title: "KASHRA — Маркетплейс игровых товаров",
  description: "Покупка и продажа игровых аккаунтов, предметов, валюты и услуг",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="wrapper">
          <Header />
          <div className="wrapper-content">
            <main className="main">{children}</main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  )
}