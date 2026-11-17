import type { IceLevel, SugarLevel } from "./menu";

export type CartLine = {
  key: string;
  itemId: string;
  kind: "set" | "drink";
  nameZh: string;
  quantity: number;
  unitPriceCents: number;
  ice: IceLevel | null;
  sugar: SugarLevel | null;
  drinkId: string | null;
  drinkName: string | null;
  preferHot: boolean;
};

export type PlaceOrderBody = {
  note?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    ice?: IceLevel | null;
    sugar?: SugarLevel | null;
    drinkId?: string | null;
    preferHot?: boolean;
  }>;
};
