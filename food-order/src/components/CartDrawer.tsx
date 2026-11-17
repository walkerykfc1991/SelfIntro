"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatHkd, iceLabel, sugarLabel } from "@/lib/menu";

type Props = {
  open: boolean;
  onClose: () => void;
  onPlaced: (orderId: string) => void;
};

export function CartDrawer({ open, onClose, onPlaced }: Props) {
  const { lines, totalCents, updateQty, removeLine, placeOrder, placing } =
    useCart();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setError(null);
    const result = await placeOrder(note);
    if (!result.ok) {
      setError(
        result.error === "empty_cart"
          ? "購物車係空嘅"
          : "落單失敗，請再試一次",
      );
      return;
    }
    setNote("");
    onPlaced(result.id);
  }

  return (
    <div className="drawer-root" role="presentation" onClick={onClose}>
      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="購物車"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <h2>購物車</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            關閉
          </button>
        </header>

        {lines.length === 0 ? (
          <p className="empty-cart">未有嘢喺度 · 先揀套餐或飲品啦</p>
        ) : (
          <ul className="cart-list">
            {lines.map((line) => (
              <li key={line.key}>
                <div className="cart-line-main">
                  <strong>{line.nameZh}</strong>
                  <span>{formatHkd(line.unitPriceCents * line.quantity)}</span>
                </div>
                <p className="cart-meta">
                  {[
                    line.drinkName ? `飲品：${line.drinkName}` : null,
                    line.ice ? iceLabel(line.ice) : null,
                    line.sugar ? sugarLabel(line.sugar) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="cart-line-actions">
                  <div className="qty compact">
                    <button
                      type="button"
                      onClick={() => updateQty(line.key, line.quantity - 1)}
                      aria-label="減少"
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(line.key, Math.min(20, line.quantity + 1))
                      }
                      aria-label="增加"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => removeLine(line.key)}
                  >
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="drawer-checkout">
            <label className="note-field">
              <span>備註</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：唔該快啲 / 少蔥"
                maxLength={200}
              />
            </label>
            <div className="total-row">
              <span>合計</span>
              <strong>{formatHkd(totalCents)}</strong>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button
              type="button"
              className="btn-primary wide"
              disabled={placing}
              onClick={submit}
            >
              {placing ? "落單緊…" : "確認落單"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
