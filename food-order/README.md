# 茶記 Cha Kee — HK food order

Private full-stack Hong Kong cha chaan teng style ordering app.

- **套餐** with included drink choice
- **飲品** with 熱／凍, **冰量** (正常／少／走／多冰), **甜度** (正常／少／半／走糖)
- Orders stored in Postgres (PGlite locally)

## Develop

```bash
cd food-order
npm install
env -u DATABASE_URL npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Local identity is simulated via `cursor/identity.dev.ts`.

## Publish

Publish the `food-order` folder with Cursor Apps as **private**. The app declares Postgres in `cursor-app.json`.
