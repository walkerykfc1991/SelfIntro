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

## Publish (Cursor Apps)

Publish the `food-order` folder with Cursor Apps as **private**. The app declares Postgres in `cursor-app.json`.

## Deploy on Render (free demo)

1. Push this repo to GitHub (branch with `render.yaml` at the root).
2. Open [Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint) and connect the repo.
3. Apply the Blueprint — creates free web service **cha-kee** + free Postgres **cha-kee-db** (Singapore).
4. Wait for the first deploy. Free web apps sleep after 15 minutes idle (~1 min cold start). Free Postgres expires after **30 days**.

Auth on Render uses the local demo viewer (not Cursor sign-in). For private Cursor auth, use Cursor Apps instead.
