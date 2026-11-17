"use client";

import { useEffect, useState } from "react";
import { formatHkd, iceLabel, sugarLabel, type IceLevel, type SugarLevel } from "@/lib/menu";

type OrderItem = {
  itemId: string;
  name: string;
  kind: string;
  quantity: number;
  unitPriceCents: number;
  ice: IceLevel | null;
  sugar: SugarLevel | null;
  drinkName: string | null;
  lineTotalCents: number;
};

type Order = {
  id: string;
  status: string;
  totalCents: number;
  note: string;
  createdAt: string;
  items: OrderItem[];
};

export function OrdersPanel({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOrders(null);
    setError(null);
    fetch("/api/orders")
      .then(async (res) => {
        if (!res.ok) throw new Error("load_failed");
        return (await res.json()) as Order[];
      })
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setError("暫時讀唔到訂單");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) {
    return (
      <main className="orders-stage">
        <p className="form-error">{error}</p>
      </main>
    );
  }

  if (!orders) {
    return (
      <main className="orders-stage">
        <p className="muted">載入訂單…</p>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="orders-stage">
        <p className="empty-cart">未有訂單 · 去菜單落單啦</p>
      </main>
    );
  }

  return (
    <main className="orders-stage">
      <p className="section-lead">你嘅最近訂單</p>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id} className="order-block">
            <header>
              <div>
                <strong>訂單 #{order.id}</strong>
                <time dateTime={order.createdAt}>
                  {formatHongKongTime(order.createdAt)}
                </time>
              </div>
              <span className="status">{statusLabel(order.status)}</span>
            </header>
            <ul>
              {order.items.map((item, idx) => (
                <li key={`${order.id}-${idx}`}>
                  <span>
                    {item.quantity}× {item.name}
                    {item.drinkName ? `（${item.drinkName}）` : ""}
                    {(item.ice || item.sugar) && (
                      <em>
                        {[
                          item.ice ? iceLabel(item.ice) : null,
                          item.sugar ? sugarLabel(item.sugar) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </em>
                    )}
                  </span>
                  <span>{formatHkd(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            {order.note && <p className="order-note">備註：{order.note}</p>}
            <footer>
              <span>合計</span>
              <strong>{formatHkd(order.totalCents)}</strong>
            </footer>
          </li>
        ))}
      </ul>
    </main>
  );
}

function statusLabel(status: string): string {
  if (status === "pending") return "準備中";
  if (status === "ready") return "可取餐";
  if (status === "done") return "完成";
  return status;
}

function formatHongKongTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
