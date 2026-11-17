"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { CartLine } from "./cart-types";
import type { IceLevel, MenuItem, SugarLevel } from "./menu";
import { drinkNeedsIce, getDrink } from "./menu";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  totalCents: number;
  addLine: (input: {
    item: MenuItem;
    quantity: number;
    ice: IceLevel | null;
    sugar: SugarLevel | null;
    drinkId: string | null;
    preferHot: boolean;
  }) => void;
  updateQty: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  placing: boolean;
  placeOrder: (
    note: string,
  ) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(parts: {
  itemId: string;
  ice: IceLevel | null;
  sugar: SugarLevel | null;
  drinkId: string | null;
  preferHot: boolean;
}): string {
  return [
    parts.itemId,
    parts.drinkId ?? "",
    parts.ice ?? "",
    parts.sugar ?? "",
    parts.preferHot ? "hot" : "cold",
  ].join("|");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<CartLine[]>([]);
  const [lines, setOptimistic] = useOptimistic(base);
  const [placing, startPlace] = useTransition();

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const totalCents = lines.reduce(
    (n, l) => n + l.unitPriceCents * l.quantity,
    0,
  );

  function addLine(input: {
    item: MenuItem;
    quantity: number;
    ice: IceLevel | null;
    sugar: SugarLevel | null;
    drinkId: string | null;
    preferHot: boolean;
  }) {
    const drink =
      input.item.kind === "set" && input.drinkId
        ? getDrink(input.drinkId)
        : input.item.kind === "drink"
          ? input.item
          : undefined;

    let nameZh = input.item.nameZh;
    let drinkName: string | null = null;

    if (input.item.kind === "drink" && drink) {
      if (drink.hotCold === "both") {
        nameZh = `${input.preferHot ? "熱" : "凍"}${drink.nameZh}`;
      }
    } else if (input.item.kind === "set" && drink) {
      drinkName =
        drink.hotCold === "both"
          ? `${input.preferHot ? "熱" : "凍"}${drink.nameZh}`
          : drink.nameZh;
    }

    const key = lineKey({
      itemId: input.item.id,
      ice: input.ice,
      sugar: input.sugar,
      drinkId: input.drinkId,
      preferHot: input.preferHot,
    });

    setBase((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key
            ? { ...l, quantity: Math.min(20, l.quantity + input.quantity) }
            : l,
        );
      }
      return [
        ...prev,
        {
          key,
          itemId: input.item.id,
          kind: input.item.kind,
          nameZh,
          quantity: input.quantity,
          unitPriceCents: input.item.priceCents,
          ice: input.ice,
          sugar: input.sugar,
          drinkId: input.drinkId,
          drinkName,
          preferHot: input.preferHot,
        },
      ];
    });
  }

  function updateQty(key: string, quantity: number) {
    setBase((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(key: string) {
    setBase((prev) => prev.filter((l) => l.key !== key));
  }

  function clear() {
    setBase([]);
  }

  function placeOrder(note: string) {
    const snapshot = lines;
    return new Promise<{ ok: true; id: string } | { ok: false; error: string }>(
      (resolve) => {
        startPlace(async () => {
          setOptimistic([]);
          try {
            const res = await fetch("/api/orders", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                note,
                items: snapshot.map((l) => ({
                  itemId: l.itemId,
                  quantity: l.quantity,
                  ice: l.ice,
                  sugar: l.sugar,
                  drinkId: l.drinkId,
                  preferHot: l.preferHot,
                })),
              }),
            });
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as {
                error?: string;
              };
              setBase(snapshot);
              resolve({ ok: false, error: data.error ?? "order_failed" });
              return;
            }
            const data = (await res.json()) as { id: string };
            setBase([]);
            resolve({ ok: true, id: data.id });
          } catch {
            setBase(snapshot);
            resolve({ ok: false, error: "network" });
          }
        });
      },
    );
  }

  return (
    <CartContext.Provider
      value={{
        lines,
        count,
        totalCents,
        addLine,
        updateQty,
        removeLine,
        clear,
        placing,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function needsIceForSelection(
  item: MenuItem,
  drinkId: string | null,
  preferHot: boolean,
): boolean {
  if (item.kind === "drink") return drinkNeedsIce(item, preferHot);
  if (!drinkId) return false;
  const drink = getDrink(drinkId);
  if (!drink) return false;
  return drinkNeedsIce(drink, preferHot);
}
