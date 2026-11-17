export type IceLevel = "normal" | "less" | "no" | "extra";
export type SugarLevel = "normal" | "less" | "half" | "no";

export type DrinkItem = {
  id: string;
  kind: "drink";
  nameZh: string;
  nameEn: string;
  priceCents: number;
  hotCold: "cold" | "hot" | "both";
  blurb: string;
};

export type SetItem = {
  id: string;
  kind: "set";
  nameZh: string;
  nameEn: string;
  priceCents: number;
  includes: string;
  drinkChoices: string[];
  blurb: string;
};

export type MenuItem = DrinkItem | SetItem;

export const ICE_OPTIONS: { value: IceLevel; labelZh: string; labelEn: string }[] =
  [
    { value: "normal", labelZh: "正常冰", labelEn: "Regular ice" },
    { value: "less", labelZh: "少冰", labelEn: "Less ice" },
    { value: "no", labelZh: "走冰", labelEn: "No ice" },
    { value: "extra", labelZh: "多冰", labelEn: "Extra ice" },
  ];

export const SUGAR_OPTIONS: {
  value: SugarLevel;
  labelZh: string;
  labelEn: string;
}[] = [
  { value: "normal", labelZh: "正常糖", labelEn: "Regular sugar" },
  { value: "less", labelZh: "少糖", labelEn: "Less sugar" },
  { value: "half", labelZh: "半糖", labelEn: "Half sugar" },
  { value: "no", labelZh: "走糖", labelEn: "No sugar" },
];

export const DRINKS: DrinkItem[] = [
  {
    id: "milk-tea",
    kind: "drink",
    nameZh: "奶茶",
    nameEn: "Hong Kong milk tea",
    priceCents: 2200,
    hotCold: "both",
    blurb: "絲襪奶茶，濃香夠喉",
  },
  {
    id: "lemon-tea",
    kind: "drink",
    nameZh: "凍檸茶",
    nameEn: "Iced lemon tea",
    priceCents: 2000,
    hotCold: "cold",
    blurb: "清爽檸檬，下午必備",
  },
  {
    id: "lemon-water",
    kind: "drink",
    nameZh: "凍檸水",
    nameEn: "Iced lemon water",
    priceCents: 1800,
    hotCold: "cold",
    blurb: "酸甜解渴",
  },
  {
    id: "yuanyang",
    kind: "drink",
    nameZh: "鴛鴦",
    nameEn: "Yuanyang",
    priceCents: 2400,
    hotCold: "both",
    blurb: "咖啡撞奶茶",
  },
  {
    id: "coffee",
    kind: "drink",
    nameZh: "咖啡",
    nameEn: "Coffee",
    priceCents: 2200,
    hotCold: "both",
    blurb: "經典港式咖啡",
  },
  {
    id: "soy",
    kind: "drink",
    nameZh: "豆漿",
    nameEn: "Soy milk",
    priceCents: 1600,
    hotCold: "both",
    blurb: "自家煮豆漿",
  },
  {
    id: "coke",
    kind: "drink",
    nameZh: "可樂",
    nameEn: "Coke",
    priceCents: 1400,
    hotCold: "cold",
    blurb: "冰凍可樂",
  },
];

export const SETS: SetItem[] = [
  {
    id: "set-macaroni",
    kind: "set",
    nameZh: "餐蛋通粉套餐",
    nameEn: "Macaroni set",
    priceCents: 4800,
    includes: "餐蛋通粉 + 飲品",
    drinkChoices: ["milk-tea", "lemon-tea", "coffee", "coke"],
    blurb: "茶餐廳經典早晨",
  },
  {
    id: "set-french-toast",
    kind: "set",
    nameZh: "西多士套餐",
    nameEn: "French toast set",
    priceCents: 4500,
    includes: "西多士 + 飲品",
    drinkChoices: ["milk-tea", "coffee", "yuanyang", "soy"],
    blurb: "酥脆外皮，甜而不膩",
  },
  {
    id: "set-ham-egg-rice",
    kind: "set",
    nameZh: "火腿煎蛋飯套餐",
    nameEn: "Ham & egg rice set",
    priceCents: 5200,
    includes: "火腿煎蛋飯 + 飲品",
    drinkChoices: ["milk-tea", "lemon-tea", "lemon-water", "coke"],
    blurb: "厚切火腿配滑蛋",
  },
  {
    id: "set-pork-chop",
    kind: "set",
    nameZh: "豬扒飯套餐",
    nameEn: "Pork chop rice set",
    priceCents: 5800,
    includes: "豬扒飯 + 飲品",
    drinkChoices: ["milk-tea", "lemon-tea", "yuanyang", "coke"],
    blurb: "香脆豬扒，汁汁飯香",
  },
  {
    id: "set-curry-beef",
    kind: "set",
    nameZh: "咖哩牛腩飯套餐",
    nameEn: "Curry beef brisket set",
    priceCents: 6200,
    includes: "咖哩牛腩飯 + 飲品",
    drinkChoices: ["milk-tea", "lemon-water", "soy", "coke"],
    blurb: "慢煮牛腩，咖哩濃郁",
  },
  {
    id: "set-satay-beef",
    kind: "set",
    nameZh: "沙爹牛肉麵套餐",
    nameEn: "Satay beef noodle set",
    priceCents: 5500,
    includes: "沙爹牛肉麵 + 飲品",
    drinkChoices: ["milk-tea", "lemon-tea", "coffee", "coke"],
    blurb: "沙爹香辣，麵條彈牙",
  },
];

const drinkMap = Object.fromEntries(DRINKS.map((d) => [d.id, d]));

export function getDrink(id: string): DrinkItem | undefined {
  return drinkMap[id];
}

export function getMenuItem(id: string): MenuItem | undefined {
  return SETS.find((s) => s.id === id) ?? drinkMap[id];
}

export function formatHkd(cents: number): string {
  return `$${ (cents / 100).toFixed(0) }`;
}

export function iceLabel(value: IceLevel | null | undefined): string {
  return ICE_OPTIONS.find((o) => o.value === value)?.labelZh ?? "";
}

export function sugarLabel(value: SugarLevel | null | undefined): string {
  return SUGAR_OPTIONS.find((o) => o.value === value)?.labelZh ?? "";
}

export function drinkNeedsIce(drink: DrinkItem, preferHot: boolean): boolean {
  if (drink.hotCold === "hot") return false;
  if (drink.hotCold === "cold") return true;
  return !preferHot;
}
