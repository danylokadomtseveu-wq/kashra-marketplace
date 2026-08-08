import Link from "next/link"
import { SearchBox } from "./SearchBox"
import { Navigation } from "./Navigation"

export function Header() {
  return (
    <header id="header" className="navbar navbar-default">
      <div className="container-fluid">
        <div className="navbar-header">
          <Link href="/" className="navbar-brand">
            <span className="brand-logo">KASHRA</span>
          </Link>
          <SearchBox />
        </div>
        <Navigation />
      </div>
    </header>
  )
}