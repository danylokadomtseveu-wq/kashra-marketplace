import Link from "next/link"

export function Navigation() {
  return (
    <div className="nav-container">
      <nav className="navbar-collapse" aria-label="Основная навигация">
        <ul className="nav navbar-nav navbar-right">
          <li className="nav-item"><Link href="/catalog">Каталог</Link></li>
          <li className="nav-item"><Link href="/cart">Корзина</Link></li>
          <li className="nav-item"><Link href="/orders">Покупки</Link></li>
          <li className="nav-item"><Link href="/sell">Продать</Link></li>
          <li className="nav-item"><Link href="/messages">Сообщения</Link></li>
          <li className="nav-item"><Link href="/profile">Профиль</Link></li>
          <li className="nav-item"><Link href="/auth/login" className="nav-register">Войти</Link></li>
        </ul>
      </nav>
    </div>
  )
}
