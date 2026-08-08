export default function OrdersPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Мои заказы</h1>
      </div>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        textAlign: "center",
        padding: 60,
        color: "var(--text-3)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <p style={{ fontSize: 14 }}>У вас пока нет заказов</p>
      </div>
    </div>
  )
}
