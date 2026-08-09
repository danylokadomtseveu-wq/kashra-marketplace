"use client"
import Link from "next/link"
import { RequireAuth, useSession } from "@/lib/session"
export default function ProfilePage(){const{user}=useSession();return <RequireAuth><div className="form-page"><div className="page-kicker">KASHRA</div><h1 className="form-title">Профиль</h1><div className="form-box"><div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"flex-start"}}><div><div style={{fontSize:18,fontWeight:700,color:"#fff"}}>{user?.name??"Загрузка…"}</div><div className="message-meta">{user?.email??""}</div><div className="message-meta">{roleLabel(user?.role)} · {user?.status==="ACTIVE"?"Активен":"Заблокирован"}</div></div></div></div><div className="form-note"><Link href="/orders">Мои покупки</Link> · <Link href="/sell">Продать товар</Link> · <Link href="/messages">Сообщения</Link></div></div></RequireAuth>}

function roleLabel(role?: string) {
  switch (role) {
    case "SELLER":
      return "Продавец"
    case "ADMIN":
      return "Администратор"
    default:
      return "Покупатель"
  }
}