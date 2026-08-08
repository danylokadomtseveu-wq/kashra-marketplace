import Link from "next/link"
export default function NotFound(){return <div className="empty-state" style={{marginTop:50}}><div className="page-kicker">404</div><div className="empty-state-title">Страница не найдена</div><div>Проверь адрес или вернись в каталог.</div><Link href="/" className="empty-state-link">На главную</Link></div>}
