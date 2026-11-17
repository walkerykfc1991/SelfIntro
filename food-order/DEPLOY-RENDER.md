# Deploy 茶記 Cha Kee to Render (free demo)

Use this with a human **or** paste it to another bot/agent and say:  
**“Follow DEPLOY-RENDER.md and deploy this repo to Render.”**

## Repo facts

| Item | Value |
| --- | --- |
| GitHub repo | `walkerykfc1991/SelfIntro` |
| Branch with Blueprint | `cursor/render-deploy-5598` |
| Blueprint file | `render.yaml` (repo root) |
| App folder | `food-order/` |
| PR | https://github.com/walkerykfc1991/SelfIntro/pull/8 |

What the Blueprint creates:

- Free web service **cha-kee** (Next.js, rootDir `food-order`, Singapore)
- Free Postgres **cha-kee-db** (expires after **30 days**)

## Option A — Dashboard (no API key)

1. Open https://dashboard.render.com/select-repo?type=blueprint  
2. Sign in to Render (GitHub login is fine).  
3. Connect / select repo **`walkerykfc1991/SelfIntro`**.  
4. Select branch **`cursor/render-deploy-5598`** (not `main` unless that branch already has `render.yaml`).  
5. Confirm Blueprint preview shows:
   - web: `cha-kee`
   - database: `cha-kee-db`
6. Click **Apply** / **Deploy**.  
7. Wait until the web service status is **Live**.  
8. Open the service URL (`https://cha-kee-….onrender.com` or the URL Render shows).  
9. First load after idle can take ~1 minute (free tier cold start).  
10. Confirm:
    - Hero shows **茶記 / Cha Kee**
    - You can add a 套餐 with 少冰／少糖 and place an order
    - UI may show **示範模式** (demo auth, not Cursor private login)

## Option B — API (bot can do this if `RENDER_API_KEY` exists)

**Human prep (once):**

1. Create key: https://dashboard.render.com/u/settings#api-keys  
2. Store it as secret **`RENDER_API_KEY`** in Cursor Cloud Agent / environment secrets.  
3. Do **not** paste the key into chat.

**Bot commands** (run only after the secret is available as env `RENDER_API_KEY`):

```bash
# Optional: list workspaces / confirm auth
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  "https://api.render.com/v1/owners?limit=20"

# Create / sync Blueprint from the branch that contains render.yaml
curl -sS -X POST "https://api.render.com/v1/blueprints" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cha-kee",
    "repo": "https://github.com/walkerykfc1991/SelfIntro",
    "branch": "cursor/render-deploy-5598",
    "autoDeploy": "yes"
  }'
```

Then poll services until `cha-kee` is live and report the public URL:

```bash
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  "https://api.render.com/v1/services?limit=50"
```

If the Blueprint API shape differs for your account, fall back to **Option A**.

## Bot prompt (copy-paste)

```text
Follow food-order/DEPLOY-RENDER.md in repo walkerykfc1991/SelfIntro.

Goal: deploy the Cha Kee food-order app to Render free tier using render.yaml.

Prefer Option B if env RENDER_API_KEY is set; otherwise give me the Option A dashboard link and exact clicks.
After deploy, return the live URL and verify GET / returns 200.
Do not ask me to paste secrets into chat.
```

## Limits to expect

- Free web **sleeps after 15 minutes** idle (~1 minute wake).  
- Free Postgres **expires in 30 days** (then upgrade or recreate).  
- Not Cursor private auth — demo viewer only.  
- For private Cursor hosting, use Cursor Apps publish instead.

## Local check (optional)

```bash
cd food-order
npm install
env -u DATABASE_URL npm run build
env -u DATABASE_URL npm run start:render
```
