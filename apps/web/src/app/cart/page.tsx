export default function CartPage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Корзина</h1>
      </div>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        textAlign: "center",
        padding: 60,
        color: "var(--text-3)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
        <p style={{ fontSize: 14, marginBottom: 4 }}>Корзина пуста</p>
        <p style={{ fontSize: 12 }}>Добавьте товары из каталога</p>
      </div>
    </div>
  )
}
