import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { SessionProvider } from "@/lib/session"
import "./globals.css"
import "./kashra-home.css"
import "./marketplace-pages.css"

export const metadata = { title: "KASHRA — Маркетплейс игровых товаров", description: "Игровой маркетплейс KASHRA" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SessionProvider>
          <div className="wrapper">
            <Header />
            <div className="wrapper-content">
              <main className="main">{children}</main>
            </div>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}