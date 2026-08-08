import Link from "next/link"

export function Navigation() {
  return (
    <div className="nav-container">
      <nav className="navbar-collapse">
        <ul className="nav navbar-nav navbar-right">
          <li className="nav-item"><Link href="/cart">Корзина</Link></li>
          <li className="nav-item"><Link href="/orders">Покупки</Link></li>
          <li className="nav-item"><Link href="/catalog">Продажи</Link></li>
          <li className="nav-item"><Link href="/profile">Профиль</Link></li>
          <li className="nav-item"><Link href="/auth/register" className="nav-register">Вход</Link></li>
        </ul>
      </nav>
    </div>
  )
}