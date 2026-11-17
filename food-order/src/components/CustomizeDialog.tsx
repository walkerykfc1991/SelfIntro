"use client";

import { useEffect, useId, useState } from "react";
import { needsIceForSelection, useCart } from "@/lib/cart-context";
import {
  formatHkd,
  getDrink,
  ICE_OPTIONS,
  SUGAR_OPTIONS,
  type IceLevel,
  type MenuItem,
  type SugarLevel,
} from "@/lib/menu";

type Props = {
  item: MenuItem | null;
  onClose: () => void;
};

export function CustomizeDialog({ item, onClose }: Props) {
  const { addLine } = useCart();
  const titleId = useId();
  const [drinkId, setDrinkId] = useState<string | null>(null);
  const [preferHot, setPreferHot] = useState(false);
  const [ice, setIce] = useState<IceLevel>("normal");
  const [sugar, setSugar] = useState<SugarLevel>("normal");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!item) return;
    setQty(1);
    setSugar("normal");
    setIce("normal");
    if (item.kind === "set") {
      setDrinkId(item.drinkChoices[0] ?? null);
      const first = getDrink(item.drinkChoices[0] ?? "");
      setPreferHot(first?.hotCold === "hot");
    } else {
      setDrinkId(null);
      setPreferHot(item.hotCold === "hot");
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const selectedDrink =
    item.kind === "set" && drinkId ? getDrink(drinkId) : null;
  const tempTarget = item.kind === "drink" ? item : selectedDrink;
  const showTemp = tempTarget?.hotCold === "both";
  const showIce = needsIceForSelection(item, drinkId, preferHot);

  function submit() {
    const current = item;
    if (!current) return;
    if (current.kind === "set" && !drinkId) return;
    addLine({
      item: current,
      quantity: qty,
      ice: showIce ? ice : null,
      sugar,
      drinkId: current.kind === "set" ? drinkId : null,
      preferHot,
    });
    onClose();
  }

  return (
    <div className="dialog-root" role="presentation" onClick={onClose}>
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <p className="dialog-kicker">
              {item.kind === "set" ? "套餐" : "飲品"}
            </p>
            <h2 id={titleId}>{item.nameZh}</h2>
            <p className="dialog-en">{item.nameEn}</p>
          </div>
          <p className="dialog-price">{formatHkd(item.priceCents)}</p>
        </header>

        <p className="dialog-blurb">
          {item.kind === "set" ? item.includes : item.blurb}
        </p>

        {item.kind === "set" && (
          <fieldset className="option-block">
            <legend>揀飲品</legend>
            <div className="option-grid">
              {item.drinkChoices.map((id) => {
                const drink = getDrink(id);
                if (!drink) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className={drinkId === id ? "chip on" : "chip"}
                    onClick={() => {
                      setDrinkId(id);
                      setPreferHot(drink.hotCold === "hot");
                    }}
                  >
                    {drink.nameZh}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {showTemp && (
          <fieldset className="option-block">
            <legend>熱／凍</legend>
            <div className="option-grid">
              <button
                type="button"
                className={!preferHot ? "chip on" : "chip"}
                onClick={() => setPreferHot(false)}
              >
                凍
              </button>
              <button
                type="button"
                className={preferHot ? "chip on" : "chip"}
                onClick={() => setPreferHot(true)}
              >
                熱
              </button>
            </div>
          </fieldset>
        )}

        {showIce && (
          <fieldset className="option-block">
            <legend>冰量</legend>
            <div className="option-grid">
              {ICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={ice === opt.value ? "chip on" : "chip"}
                  onClick={() => setIce(opt.value)}
                >
                  {opt.labelZh}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="option-block">
          <legend>甜度</legend>
          <div className="option-grid">
            {SUGAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={sugar === opt.value ? "chip on" : "chip"}
                onClick={() => setSugar(opt.value)}
              >
                {opt.labelZh}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="dialog-footer">
          <div className="qty" aria-label="數量">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="減少"
            >
              −
            </button>
            <span>{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              aria-label="增加"
            >
              +
            </button>
          </div>
          <button type="button" className="btn-primary" onClick={submit}>
            加入購物車 · {formatHkd(item.priceCents * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
