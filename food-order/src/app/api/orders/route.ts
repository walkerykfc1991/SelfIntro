import { requireIdentity } from "../../../../cursor/identity";
import type { PlaceOrderBody } from "@/lib/cart-types";
import { sql } from "@/lib/db";
import {
  drinkNeedsIce,
  getDrink,
  getMenuItem,
  type IceLevel,
  type SugarLevel,
} from "@/lib/menu";

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  note: string;
  created_at: string;
};

type ItemRow = {
  order_id: string;
  item_id: string;
  item_name: string;
  item_kind: string;
  quantity: number;
  unit_price_cents: number;
  ice: string | null;
  sugar: string | null;
  drink_name: string | null;
  line_total_cents: number;
};

const ICE = new Set(["normal", "less", "no", "extra"]);
const SUGAR = new Set(["normal", "less", "half", "no"]);

export async function GET(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const orders = await sql<OrderRow>(
    `select id::text, status, total_cents, note, created_at
     from orders
     where owner_sub = $1
     order by created_at desc
     limit 50`,
    [identity.sub],
  );

  if (orders.length === 0) {
    return Response.json([], {
      headers: { "cache-control": "private, no-store" },
    });
  }

  const ids = orders.map((o) => o.id);
  const items = await sql<ItemRow>(
    `select order_id::text, item_id, item_name, item_kind, quantity,
            unit_price_cents, ice, sugar, drink_name, line_total_cents
     from order_items
     where order_id = any($1::bigint[])
     order by id asc`,
    [ids],
  );

  const byOrder = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }

  return Response.json(
    orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.total_cents,
      note: order.note,
      createdAt: order.created_at,
      items: (byOrder.get(order.id) ?? []).map((item) => ({
        itemId: item.item_id,
        name: item.item_name,
        kind: item.item_kind,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        ice: item.ice,
        sugar: item.sugar,
        drinkName: item.drink_name,
        lineTotalCents: item.line_total_cents,
      })),
    })),
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  let body: PlaceOrderBody;
  try {
    body = (await request.json()) as PlaceOrderBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "empty_cart" }, { status: 400 });
  }
  if (body.items.length > 40) {
    return Response.json({ error: "too_many_items" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
  const lines: Array<{
    itemId: string;
    itemName: string;
    itemKind: string;
    quantity: number;
    unitPriceCents: number;
    ice: IceLevel | null;
    sugar: SugarLevel | null;
    drinkName: string | null;
    lineTotalCents: number;
  }> = [];

  for (const raw of body.items) {
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return Response.json({ error: "bad_quantity" }, { status: 400 });
    }

    const menuItem = getMenuItem(raw.itemId);
    if (!menuItem) {
      return Response.json({ error: "unknown_item" }, { status: 400 });
    }

    let ice: IceLevel | null = null;
    let sugar: SugarLevel | null = null;
    let drinkName: string | null = null;
    let itemName = menuItem.nameZh;

    if (menuItem.kind === "drink") {
      const preferHot = raw.preferHot === true;
      const needsIce = drinkNeedsIce(menuItem, preferHot);
      if (needsIce) {
        if (!raw.ice || !ICE.has(raw.ice)) {
          return Response.json({ error: "ice_required" }, { status: 400 });
        }
        ice = raw.ice;
      }
      if (!raw.sugar || !SUGAR.has(raw.sugar)) {
        return Response.json({ error: "sugar_required" }, { status: 400 });
      }
      sugar = raw.sugar;
      if (menuItem.hotCold === "both") {
        itemName = `${preferHot ? "熱" : "凍"}${menuItem.nameZh}`;
      }
    } else {
      if (!raw.drinkId || !menuItem.drinkChoices.includes(raw.drinkId)) {
        return Response.json({ error: "drink_required" }, { status: 400 });
      }
      const drink = getDrink(raw.drinkId);
      if (!drink) {
        return Response.json({ error: "unknown_drink" }, { status: 400 });
      }
      const preferHot = raw.preferHot === true;
      const needsIce = drinkNeedsIce(drink, preferHot);
      drinkName =
        drink.hotCold === "both"
          ? `${preferHot ? "熱" : "凍"}${drink.nameZh}`
          : drink.nameZh;
      if (needsIce) {
        if (!raw.ice || !ICE.has(raw.ice)) {
          return Response.json({ error: "ice_required" }, { status: 400 });
        }
        ice = raw.ice;
      }
      if (!raw.sugar || !SUGAR.has(raw.sugar)) {
        return Response.json({ error: "sugar_required" }, { status: 400 });
      }
      sugar = raw.sugar;
    }

    lines.push({
      itemId: menuItem.id,
      itemName,
      itemKind: menuItem.kind,
      quantity,
      unitPriceCents: menuItem.priceCents,
      ice,
      sugar,
      drinkName,
      lineTotalCents: menuItem.priceCents * quantity,
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const ownerName =
    identity.kind === "person"
      ? identity.name || "客人"
      : identity.name || "API";

  const [order] = await sql<{ id: string }>(
    `insert into orders (owner_sub, owner_name, status, total_cents, note)
     values ($1, $2, 'pending', $3, $4)
     returning id::text`,
    [identity.sub, ownerName, totalCents, note],
  );

  for (const line of lines) {
    await sql(
      `insert into order_items
        (order_id, item_id, item_name, item_kind, quantity, unit_price_cents,
         ice, sugar, drink_name, line_total_cents)
       values ($1::bigint, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        order.id,
        line.itemId,
        line.itemName,
        line.itemKind,
        line.quantity,
        line.unitPriceCents,
        line.ice,
        line.sugar,
        line.drinkName,
        line.lineTotalCents,
      ],
    );
  }

  return Response.json(
    { id: order.id, totalCents, status: "pending" },
    { status: 201, headers: { "cache-control": "private, no-store" } },
  );
}
