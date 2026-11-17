"use client";

import { useEffect, useState } from "react";
import { CartProvider, useCart } from "@/lib/cart-context";
import { DRINKS, SETS, formatHkd, type MenuItem } from "@/lib/menu";
import { CartDrawer } from "./CartDrawer";
import { CustomizeDialog } from "./CustomizeDialog";
import { OrdersPanel } from "./OrdersPanel";

type Viewer = {
  name: string;
  email: string;
  simulated: boolean;
};

export function OrderApp() {
  return (
    <CartProvider>
      <OrderShell />
    </CartProvider>
  );
}

function OrderShell() {
  const { count, totalCents } = useCart();
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [tab, setTab] = useState<"menu" | "orders">("menu");
  const [section, setSection] = useState<"sets" | "drinks">("sets");
  const [picked, setPicked] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ordersKey, setOrdersKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as Viewer;
      })
      .then((data) => {
        if (!cancelled) setViewer(data);
      })
      .catch(() => {
        if (!cancelled) setViewer(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const items = section === "sets" ? SETS : DRINKS;

  return (
    <div className="shell">
      <div className="atmosphere" aria-hidden="true" />

      <header className="hero">
        <div className="hero-copy">
          <p className="brand-mark">茶記</p>
          <h1>
            Cha Kee
            <span>港式茶餐廳點餐</span>
          </h1>
          <p className="hero-lead">
            套餐、凍飲、少冰少糖——街坊味道，一按落單。
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="#menu">
              開始點餐
            </a>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setTab("orders");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              我嘅訂單
            </button>
          </div>
          {viewer && (
            <p className="viewer-line">
              你好，{viewer.name}
              {viewer.simulated ? "（本機模擬登入）" : ""}
            </p>
          )}
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="neon-sign">
            <span>冰</span>
            <span>熱</span>
            <span>奶茶</span>
          </div>
          <div className="steam steam-a" />
          <div className="steam steam-b" />
          <div className="counter-plate">
            <span className="plate-set">餐蛋通粉</span>
            <span className="plate-drink">凍檸茶 · 少冰少糖</span>
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="主要分類">
        <button
          type="button"
          className={tab === "menu" ? "tab on" : "tab"}
          onClick={() => setTab("menu")}
        >
          菜單
        </button>
        <button
          type="button"
          className={tab === "orders" ? "tab on" : "tab"}
          onClick={() => setTab("orders")}
        >
          訂單
        </button>
      </nav>

      {tab === "menu" ? (
        <main id="menu" className="menu-stage">
          <div className="section-switch">
            <button
              type="button"
              className={section === "sets" ? "chip on" : "chip"}
              onClick={() => setSection("sets")}
            >
              套餐
            </button>
            <button
              type="button"
              className={section === "drinks" ? "chip on" : "chip"}
              onClick={() => setSection("drinks")}
            >
              飲品
            </button>
          </div>

          <p className="section-lead">
            {section === "sets"
              ? "每款套餐包飲品，凍飲可揀冰量同甜度。"
              : "港式奶茶、凍檸茶——正常／少／走冰糖，隨你調。" }
          </p>

          <ul className="menu-list">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="menu-row"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <button type="button" onClick={() => setPicked(item)}>
                  <span className="menu-text">
                    <strong>{item.nameZh}</strong>
                    <em>{item.nameEn}</em>
                    <span>
                      {item.kind === "set" ? item.includes : item.blurb}
                    </span>
                  </span>
                  <span className="menu-price">
                    {formatHkd(item.priceCents)}
                    <span className="add-cue">選配</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </main>
      ) : (
        <OrdersPanel refreshKey={ordersKey} />
      )}

      <button
        type="button"
        className="cart-fab"
        onClick={() => setCartOpen(true)}
        aria-label={`購物車，${count} 項`}
      >
        <span className="fab-label">購物車</span>
        <span className="fab-count">{count}</span>
        <span className="fab-total">{formatHkd(totalCents)}</span>
      </button>

      <CustomizeDialog item={picked} onClose={() => setPicked(null)} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onPlaced={(id) => {
          setCartOpen(false);
          setTab("orders");
          setOrdersKey((k) => k + 1);
          setToast(`落單成功 #${id}`);
        }}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
