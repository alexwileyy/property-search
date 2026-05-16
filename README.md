# Property Search

Personal property-tracking app. Ingests listings from RightMove (URL paste) and any property site (bookmarklet), runs them through Claude for structured extraction, tracks them through a 7-column kanban from "Interested" to "Offer made / Rejected".

Stack: Next.js 16 (App Router), TypeScript, Radix UI Themes, Tailwind, Drizzle ORM, Supabase Postgres, Anthropic Claude (Haiku 4.5) for extraction, deployed on Vercel.

## Local setup

### 1. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Once it's provisioned, go to **Project Settings → Database → Connection string**.
3. Grab two URIs:
   - **Transaction pooler** (port 6543) - this is `DATABASE_URL` (used at runtime by Vercel functions)
   - **Direct connection** (port 5432) - this is `DIRECT_DATABASE_URL` (used by drizzle-kit for migrations)
4. Note the **Project URL** and the **secret key** (`sb_secret_...`) from Project Settings -> API keys - both are used for the photo archive (step 3 below).

### 2. Env vars

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Supabase transaction-pooled URI |
| `DIRECT_DATABASE_URL` | Supabase direct URI (migrations only) |
| `APP_PASSWORD` | Whatever password gates the web UI |
| `SESSION_SECRET` | 32+ char random string. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `BOOKMARKLET_TOKEN` | Bearer token used by the property bookmarklet. Generate same way. |
| `ANTHROPIC_API_KEY` | API key from [console.anthropic.com](https://console.anthropic.com/settings/keys). Used for property extraction. |
| `SUPABASE_URL` | Project URL from **Supabase → Project Settings → API**. _Optional_; needed for photo archival. |
| `SUPABASE_SECRET_KEY` | The key starting with `sb_secret_...` from **Supabase → Project Settings → API keys**. Bypasses RLS so the app can write to Storage. _Optional_; needed for photo archival. Server-side only - never expose to the browser. (Legacy `SUPABASE_SERVICE_ROLE_KEY` JWT also works if you're on the old key model.) |

### 3. Create the photo-archive bucket (optional)

The app mirrors property photos to your Supabase Storage so they survive listings being delisted. To enable it:

1. In Supabase Dashboard, go to **Storage**.
2. Click **New bucket**, name it `property-photos`, and tick **Public bucket** (so the images can load via plain `<img>` URLs without signed-URL juggling).
3. Save. Set the `SUPABASE_URL` and `SUPABASE_SECRET_KEY` env vars above.

If those env vars aren't set, the app skips archival and keeps showing photos from the source CDN.

### 4. Install and migrate

```bash
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in with `APP_PASSWORD`.

## Database

Schema lives in `src/db/schema.ts`. Workflow:

```bash
npm run db:generate   # create migration SQL after editing schema
npm run db:migrate    # apply pending migrations to the database
npm run db:studio     # open Drizzle Studio
npm run db:push       # (dev only) push schema without migrations
```

## Deploying to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project → Import** the repo.
3. Add the env vars from `.env.local` under **Settings → Environment Variables**.
4. Deploy. The proxy password gate runs on every request.

After deploy, run migrations against the prod DB locally:

```bash
DATABASE_URL=$PROD_DIRECT_URL npm run db:migrate
```
