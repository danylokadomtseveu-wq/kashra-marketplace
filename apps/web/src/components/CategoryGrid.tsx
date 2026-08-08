import Link from "next/link"
import { YOUR_GAMES } from "@/data/categories"
export function CategoryGrid(){return <div className="promo-cats"><div className="promo-cats-label">ВАШИ<br/>ИГРЫ</div><div className="cat-grid">{YOUR_GAMES.map(col=><div key={col.title} className="cat-item"><div className="promo-cat-title">{col.title}</div><ul className="promo-cat-links">{col.links.map(link=><li key={link}><Link href={`/search?q=${encodeURIComponent(`${col.title} ${link}`)}`}>{link}</Link></li>)}</ul></div>)}</div></div>}
