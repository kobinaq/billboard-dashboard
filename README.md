# ThinkAloud Billboard Dashboard

ThinkAloud Billboard Dashboard is a React + Supabase application for managing billboard inventory, contracts, payments, inspections, and client portal access from one responsive workspace.

## Stack

- React 18 with Create React App
- React Router v6
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and RLS
- React Hook Form + Zod
- Mapbox GL JS
- Recharts
- react-hot-toast

## Project Structure

The app follows the structure described in the product prompt:

- `src/components` for layout and shared UI primitives
- `src/pages` for module screens
- `src/context` for auth and app shell state
- `src/hooks` for Supabase-backed data access
- `src/lib` for constants, Supabase setup, and helpers
- `supabase/schema.sql` for schema, RLS, triggers, and storage policies
- `.github/workflows/keep-alive.yml` for Supabase free-tier uptime support

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in:

```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

3. Start the development server:

```bash
npm start
```

## Supabase Setup

1. Create a new Supabase project.
2. Open the SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Confirm the buckets exist:
   - `billboard-media` public
   - `contract-artwork` private
4. Deploy the Edge Functions:

```bash
supabase functions deploy admin-user-upsert
supabase functions deploy admin-user-deactivate
```

5. Set the required function secrets in Supabase:

```bash
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_ANON_KEY=your_supabase_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SITE_URL=https://your-app-url
```

6. In Authentication, create the initial admin user manually.
7. Update that user in `profiles` so `role = 'admin'`.
8. Seed any additional regions or billboard types in the Settings UI or directly in the database.

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

3. Sign in through `/login`.

## Storage Conventions

- Billboard covers: `billboard-media/billboards/{billboardId}/cover-*`
- Inspection photos: `billboard-media/inspections/{inspectionId}/{photoId}-*`
- Contract artwork: `contract-artwork/contracts/{contractId}/artwork-*`

## Deployment

### Frontend on Vercel

1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Set the three `REACT_APP_*` environment variables in Vercel.
4. Deploy using the default CRA build command:
   - Build command: `npm run build`
   - Output directory: `build`

### Supabase Keep-Alive

If you are on the Supabase free tier:

1. Add GitHub repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
2. Commit `.github/workflows/keep-alive.yml`.
3. Trigger the workflow once from the GitHub Actions UI to verify connectivity.

## Notes and Limitations

- The UI is wired to live Supabase tables and does not include mock data.
- Admin-managed user creation, client invites, and deactivation now run through Supabase Edge Functions and require the function secrets above.
- User deactivation in this version is soft deactivation through `profiles.is_active = false`; it preserves auth history and business data.
- The contract calendar is intentionally lightweight in this first implementation and can be upgraded to a richer Gantt-style visualization later.

## Verification Checklist

- `npm install`
- `npm start`
- `npm run build`
- Run the SQL in `supabase/schema.sql`
- Deploy `admin-user-upsert` and `admin-user-deactivate`
- Verify each role lands on the expected home route
- Verify inactive users are signed out after profile bootstrap
- Verify admin invite, update, client linking, and deactivate flows from Settings
- Verify contract overlap blocking and payment rollups in Supabase
