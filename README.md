# World Cup Predictions

A production-ready FIFA World Cup 2026 prediction web app.
Users submit a winner + exact score for each fixture and compete on global and private league leaderboards.

- **Frontend:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind · shadcn/ui · React Hook Form · Zod
- **Backend:** Supabase (PostgreSQL, Auth, RLS) · Next.js API routes for admin actions
- **Hosting:** Vercel (frontend) + Supabase (managed Postgres + Auth)

---

## Scoring rules

| Outcome             | Points |
|---------------------|--------|
| Correct winner      | +1     |
| Exact score         | +3     |
| **Max per match**   | **4**  |

Predictions lock **5 minutes before kickoff**. The lock is enforced at three layers:

1. UI — the form is disabled and the countdown badge shows `Locked`.
2. API route — server checks before forwarding the upsert.
3. **Database trigger** (`enforce_prediction_lock`) — the authoritative guard. Even a service-role write goes through this trigger unless explicitly bypassed.

---

## 1. Project setup

```powershell
# from this folder
npm install
copy .env.example .env.local   # then fill in real values
npm run dev
```

Open <http://localhost:3000>.

### Required environment variables

| Variable                          | Where to find it                                                |
|----------------------------------|-----------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase Dashboard → Project Settings → API → Project URL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Same page → `anon` `public` key                                 |
| `SUPABASE_SERVICE_ROLE_KEY`      | Same page → `service_role` `secret` key (**server only**)       |
| `NEXT_PUBLIC_SITE_URL`           | Public origin, e.g. `http://localhost:3000` / your Vercel URL   |

The `SUPABASE_SERVICE_ROLE_KEY` is used by admin-only API routes
(`/api/admin/*` and `/api/leagues/join`) and must never be exposed to the browser.

---

## 2. Supabase setup

1. **Create a project** at <https://supabase.com>.
2. In **SQL Editor**, run the migrations in order from the `supabase/migrations/` folder:
   - `0001_schema.sql`
   - `0002_functions_and_triggers.sql`
   - `0003_rls.sql`
   - `0004_views.sql`
3. (Optional) Run `supabase/seed.sql` for demo matches.

### Enable Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google** → enable it.
2. Add your OAuth redirect URL: `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).
3. In Google Cloud Console, create an OAuth client and add the same redirect.
4. Paste the client ID/secret into Supabase.

### Email auth + password reset

Email/password is enabled by default. Configure the **Reset Password** email template
(Authentication → Email Templates) to redirect to `{{ .SiteURL }}/reset-password`.

### Promote your first admin

```sql
update public.profiles
   set is_admin = true
 where id = '<your-auth-user-id>';
```

---

## 3. Importing fixtures

Sign in as an admin and visit **`/admin/import`**. Upload `World Cup.ics`
(included at the root of this repo). The endpoint:

- Parses every `VEVENT` with `node-ical`.
- Strips flag emojis from the SUMMARY field (e.g. `🇲🇽 Mexico` → `Mexico`).
- Upserts by ICS `UID` so re-importing is idempotent.

Imported matches appear under `/admin/matches` and on the public `/matches` page.

---

## 4. Recording results

Admin → **`/admin/results`** → enter the final score for a match → **Save**.

Triggering a result write fires two database triggers:

1. `matches_set_winner` — derives `winner` from the scores and sets `status = 'finished'`.
2. `matches_after_result_recompute` → calls `recompute_match_scores()` which:
   - rewrites `points_awarded` on every prediction for that match, and
   - recalculates `total_points` on every affected profile.

No application code is needed for scoring — the DB does it atomically.

---

## 5. Architecture

```
src/
├─ app/                      # Next.js App Router
│  ├─ (auth)/                # /login, /register, /forgot-password, /reset-password
│  ├─ admin/                 # admin-gated section (layout calls requireAdmin())
│  │  ├─ import, matches, results, users
│  ├─ api/                   # route handlers
│  │  ├─ predictions/        # user upserts via RLS
│  │  ├─ leagues/            # create + join + leave
│  │  └─ admin/              # import-ics, results, matches, users (service-role)
│  ├─ auth/callback/         # OAuth code exchange
│  ├─ dashboard, matches, my-predictions, leagues, leaderboard, profile, page.tsx
├─ components/
│  ├─ ui/                    # shadcn primitives
│  ├─ auth/                  # forms (login, register, forgot, reset)
│  └─ match-card, prediction-form, countdown, site-header, theme-*
├─ lib/
│  ├─ supabase/{client,server,middleware}.ts   # browser, RSC/route, edge clients
│  ├─ auth.ts                # requireSession / requireAdmin helpers
│  ├─ scoring.ts (+ .test)   # pure scoring function mirrored from SQL
│  ├─ validations.ts         # Zod schemas
│  └─ env.ts, api.ts, time.ts, utils.ts
├─ types/database.ts         # hand-maintained DB types (matches Supabase schema)
└─ middleware.ts             # session refresh + route protection
supabase/
├─ migrations/               # 4 SQL files, run in order in the SQL editor
└─ seed.sql                  # optional demo data
```

### Security model

- **RLS is on for every table.** Users read public match info & leaderboards, manage
  only their own predictions, and only see leagues they belong to.
- **`is_admin()`** is a `SECURITY DEFINER` SQL function that all admin RLS policies
  call — no client-side trust.
- **Service-role key** is only used for: (a) ICS import upserts, (b) recording
  match results, (c) admin user management, (d) the narrow `leagues.invite_code`
  lookup needed for join-by-code.
- The 5-minute prediction lock is enforced by a `BEFORE INSERT/UPDATE` trigger on
  `predictions`, so the rule cannot be circumvented even with a direct API call.
- A `CHECK` constraint on `predictions` guarantees the predicted winner is
  consistent with the predicted score line.

---

## 6. Testing

```powershell
npm test          # vitest run (scoring tests)
npm run typecheck
npm run lint
```

---

## 7. Deployment

### Vercel

1. Push this folder to a GitHub repo.
2. Import the repo into Vercel.
3. Add the 4 environment variables (see `.env.example`).
   - **Important:** mark `SUPABASE_SERVICE_ROLE_KEY` as a server-only variable
     (don't add a `NEXT_PUBLIC_` prefix).
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL (e.g. `https://wcpred.vercel.app`).
5. Deploy.
6. Back in Supabase → Authentication → URL Configuration, add the production URL
   to **Site URL** and **Redirect URLs**.

### Supabase

No deployment step beyond running the SQL migrations once and configuring Auth providers.

---

## 8. Roadmap / known limitations

- No real-time push (e.g. Supabase Realtime) — leaderboards revalidate every 60s.
  Easy to add `supabase.channel('matches').on('postgres_changes', ...)`.
- No avatar upload UI; users can paste a URL.
- Email confirmation is on by default in Supabase; turn it off in dev for faster signups.
- For tournaments larger than a few hundred fixtures, paginate `/matches`.
