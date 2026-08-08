import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

async function fetchCategories() { const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } }); if (!res.ok) return []; return res.json() }
async function fetchListings(categoryId: string, query: string) { const url = new URL(`${API_URL}/search`); if (categoryId) url.searchParams.set("categoryId", categoryId); if (query) url.searchParams.set("q", query); url.searchParams.set("limit", "50"); const res = await fetch(url.toString(), { cache: "no-store" }); if (!res.ok) return []; const data = await res.json(); return data.items ?? [] }

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoryId?: string; query?: string }> }) {
  const params = await searchParams
  const categoryId = params.categoryId ?? ""
  const query = params.query ?? ""
  const [categories, listings] = await Promise.all([fetchCategories(), fetchListings(categoryId, query)])
  return (
    <div>
      <div className="page-header"><div><div className="page-kicker">KASHRA</div><h1 className="page-title">Каталог</h1></div><Link href="/sell" className="header-btn">Продать товар</Link></div>
      {query && <div style={{color:"var(--text-2)",marginBottom:14}}>По запросу «{query}»</div>}
      <div className="cat-tabs" style={{marginBottom:18}}><Link href="/catalog" className={`cat-tab ${!categoryId ? "active" : ""}`}>Все</Link>{categories.map((cat:{id:string;name:string})=><Link key={cat.id} href={`/catalog?categoryId=${cat.id}`} className={`cat-tab ${categoryId===cat.id?"active":""}`}>{cat.name}</Link>)}</div>
      <table className="lot-table"><thead><tr><th style={{width:"22%"}}>Продавец</th><th>Товар</th><th style={{width:"10%"}}>Кол-во</th><th style={{width:"12%",textAlign:"right"}}>Цена</th><th style={{width:"90px"}} /></tr></thead><tbody>
        {listings.length===0?<tr><td colSpan={5}><div className="empty-state">В этой категории пока нет предложений.</div></td></tr>:listings.map((item:{id:string;title:string;price:string;stock?:number;category?:{name:string};seller?:{user?:{name:string};rating?:number;online?:boolean}})=><tr key={item.id}><td><div className="seller-cell"><div className="seller-avatar">{(item.seller?.user?.name??"?").charAt(0).toUpperCase()}</div><div><div className="seller-name">{item.seller?.user?.name??"Продавец"}</div><div className="seller-rating">★ {item.seller?.rating?.toFixed(1)??"5.0"}<span className={`seller-status ${item.seller?.online?"online":"offline"}`} /></div></div></div></td><td><Link href={`/products/${item.id}`}><div className="lot-title">{item.title}</div><div className="lot-subtitle">{item.category?.name??""}</div></Link></td><td><span className={`lot-qty ${(item.stock??0)<3?"lot-qty-low":""}`}>{item.stock??"∞"}</span></td><td style={{textAlign:"right"}}><span className="lot-price">{Number(item.price).toLocaleString("ru-RU")} ₽</span></td><td><Link href={`/products/${item.id}`} className="buy-btn">Открыть</Link></td></tr>)}
      </tbody></table>
    </div>
  )
}
