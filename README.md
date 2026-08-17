# ThinkAloud Billboard Dashboard

ThinkAloud Billboard Dashboard is a React + Supabase application for managing billboard inventory, contracts, payments, inspections, and client portal access from one workspace.

The public site is a separate Astro app in `site/`. After a combined build:

- `/` is the marketing site
- `/availability` is the live public board, fed by the `public_billboard_availability` RPC
- `/app` is the operator dashboard (`/app/login`, `/app/dashboard`, and the rest)

## Stack

- Marketing: Astro 7, Tailwind v4, GSAP
- App: React 18 with Create React App, React Router v6, Tailwind CSS v3
- Supabase Auth, Postgres, Storage, and RLS
- React Hook Form + Zod
- Mapbox GL JS
- react-hot-toast

The marketing `/availability` page calls the RPC with `fetch` and the anon key. It does not ship supabase-js.

## Project Structure

- `site/` marketing site and public availability
- `src/components` layout and shared UI primitives
- `src/pages` operator screens
- `src/context` auth and app shell state
- `src/hooks` Supabase-backed data access
- `src/lib` constants, Supabase setup, and helpers
- `supabase/schema.sql` full bootstrap of schema, RLS, triggers, and storage policies
- `supabase/migrations` incremental SQL for an existing project
- public availability data is exposed through a sanitized Supabase RPC, not direct anonymous reads on private business tables
- `.github/workflows/keep-alive.yml` for Supabase free-tier uptime support

## Local Setup

Node 22.12 or newer is required for the marketing site.

1. Install dependencies:

```bash
npm install
npm --prefix site install
```

2. Copy `.env.example` to `.env` and fill in:

```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

The marketing site reads those `REACT_APP_SUPABASE_*` values (or `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`) for `/availability`.

3. Run both servers:

```bash
npm start
```

Dashboard: `http://localhost:3000/app/login`. A request to `http://localhost:3000/` redirects there.

```bash
npm --prefix site run dev
```

Marketing: `http://localhost:4321/`. That server proxies `/app` to the dashboard on port 3000.

## Supabase Setup

1. Create a new Supabase project.
2. Open the SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Confirm the buckets exist:
   - `billboard-media` public
   - `contract-artwork` private
   - `inspection-photos` private

   New inspection uploads go to `inspection-photos`. Rows that already store a public `billboard-media` URL keep working until those photos are re-uploaded.
4. On an existing project, do not re-run the full schema file. Apply the files in [`supabase/migrations`](supabase/migrations) in filename order instead. If `contracts_no_overlapping_bookings` fails, overlapping draft or active rows already exist. Fix those rows, then rerun that file. The old overlap trigger stays in place until the constraint succeeds.
5. Deploy the Edge Functions:

```bash
supabase functions deploy admin-user-upsert
supabase functions deploy admin-user-deactivate
```

6. Set the required function secrets in Supabase:

```bash
supabase secrets set PROJECT_URL=your_supabase_url
supabase secrets set ANON_KEY=your_supabase_anon_key
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SITE_URL=https://your-app-url
```

The Edge Functions also accept `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as fallback names for local compatibility.

7. In Authentication, create the initial admin user manually.
8. Update that user in `profiles` so `role = 'admin'`. Signup always creates a `client` profile, so this SQL step is required.
9. Optional: run [`supabase/seed.sql`](supabase/seed.sql) to populate removable sample data for dashboard, calendar, inspections, and payments.
10. Seed any additional regions or billboard types in the Settings UI or directly in the database.

## Initial Admin User

Because public registration is disabled, the recommended bootstrapping flow is:

1. Create a user in Supabase Auth with the admin email.
2. After signup trigger creates the `profiles` row, run:

```sql
update public.profiles
set role = 'admin',
    full_name = 'Initial Admin'
where email = 'admin@thinkaloud.com';
```

3. Sign in through `/app/login`.

## Sample Data

Use [`supabase/seed.sql`](supabase/seed.sql) if you want a non-production demo dataset.

What it adds:
- multiple billboards across several regions and statuses
- multiple clients
- staggered contracts so the calendar shows real occupied periods
- payments, inspections, and inspection photos

What it does not add:
- working auth/demo users

How to apply it:
1. Run `supabase/schema.sql`
2. Create at least one active internal user manually in Supabase Auth so inspections can attach to a real admin, sales, or inspector profile
3. Run `supabase/seed.sql`

How to remove it:
- rerun `supabase/seed.sql` after modifying or removing the sample inserts, or
- reset the database and rerun only `supabase/schema.sql`

The sample rows are tagged with `[sample]` in their notes so they are easy to identify.

## Storage Conventions

- Billboard covers: `billboard-media/billboards/{billboardId}/cover-*`
- Inspection photos: `billboard-media/inspections/{inspectionId}/{photoId}-*`
- Contract artwork: `contract-artwork/contracts/{contractId}/artwork-*`

## Deployment

Build the marketing site and the dashboard into one static tree:

```bash
npm run build:web
```

That writes Astro to `site/dist`, then copies the CRA build to `site/dist/app`. Publish `site/dist`.

SPA fallback for the dashboard: `/app/*` must serve `/app/index.html`. Netlify picks this up from `site/public/_redirects`. Vercel uses the repo-root `vercel.json`. On Render, add a rewrite with source `/app/*` and destination `/app/index.html`.

Old dashboard URLs such as `/login` redirect to `/app/login`.

### Frontend on Vercel

1. Push this repository to GitHub.
2. Import the project into Vercel. Leave the root directory at the repository root so `vercel.json` applies.
3. Set the three `REACT_APP_*` environment variables. The availability page needs the Supabase URL and anon key at build time.
4. Deploy. `vercel.json` sets:
   - Build command: `npm run build:web`
   - Output directory: `site/dist`

In Supabase Authentication, allow redirects under `https://your-domain/app/**`. `SITE_URL` may be the site origin or `https://your-domain/app/login`. If it is only the origin, invite links go to `/app/login`.

### Supabase Keep-Alive

If you are on the Supabase free tier:

1. Add GitHub repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. Commit `.github/workflows/keep-alive.yml`.
3. Trigger the workflow once from the GitHub Actions UI to verify connectivity.

## Notes and Limitations

- The UI is wired to live Supabase tables and does not include hardcoded mock data in the frontend.
- Admin-managed user creation, client invites, and deactivation now run through Supabase Edge Functions and require the function secrets above.
- User deactivation in this version is soft deactivation through `profiles.is_active = false`; it preserves auth history and business data.
- Demo business data can be loaded through `supabase/seed.sql`, but auth users are still created manually.

## Verification Checklist

- `npm start` and `npm --prefix site run dev`
- `npm run build:web`
- `npm --prefix site run budget` after a site build (ignores `site/dist/app`)
- Run the SQL in `supabase/schema.sql`
- Deploy `admin-user-upsert` and `admin-user-deactivate`
- Verify each role lands on the expected home route
- Verify inactive users are signed out after profile bootstrap
- Verify admin invite, update, client linking, and deactivate flows from Settings
- Verify contract overlap blocking and payment rollups in Supabase
