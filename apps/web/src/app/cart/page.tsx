"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type CartItem = { id:string; title:string; price:string; qty:number }

export default function CartPage() {
  const [items,setItems]=useState<CartItem[]>([])
  useEffect(()=>{setItems(JSON.parse(localStorage.getItem("kashra-cart")??"[]"))},[])
  function save(next:CartItem[]){setItems(next);localStorage.setItem("kashra-cart",JSON.stringify(next))}
  const total=items.reduce((sum,item)=>sum+Number(item.price)*item.qty,0)
  return <div><div className="page-header"><div><div className="page-kicker">KASHRA</div><h1 className="page-title">Корзина</h1></div><Link href="/catalog" className="cat-tab">Продолжить покупки</Link></div>
    {items.length===0?<div className="empty-state"><div className="empty-state-title">Корзина пуста</div><div>Добавь товары из каталога, чтобы оформить заказ.</div><Link href="/catalog" className="empty-state-link">Открыть каталог</Link></div>:<>
      <div className="cart-list">{items.map(item=><div key={item.id} className="cart-row"><div><Link href={`/products/${item.id}`} className="lot-title">{item.title}</Link><div className="lot-subtitle">{Number(item.price).toLocaleString("ru-RU")} ₽ за штуку</div></div><div style={{display:"flex",alignItems:"center",gap:12}}><button className="header-btn btn-ghost" onClick={()=>save(items.map(x=>x.id===item.id?{...x,qty:Math.max(1,x.qty-1)}:x))}>−</button><span>{item.qty}</span><button className="header-btn btn-ghost" onClick={()=>save(items.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x))}>+</button><button className="cat-tab" onClick={()=>save(items.filter(x=>x.id!==item.id))}>Удалить</button></div></div>)}</div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:20,alignItems:"center",marginTop:24}}><strong>Итого: {total.toLocaleString("ru-RU")} ₽</strong><Link href="/orders" className="buy-btn">Оформить заказ</Link></div>
    </>}
  </div>
}
