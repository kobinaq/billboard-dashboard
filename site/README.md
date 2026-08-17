# Boardbook marketing site

`/` is this site. `/availability` is the live public board. `/walkthrough` is the lead form. The operator app is `/app`.

From `site/`:

```
npm install
npm run dev
npm run build
npm run preview
npm run budget
```

From the repo root, `npm start` serves the dashboard at `http://localhost:3000/app`. `astro dev` proxies `/app` there.

`npm run build:web` at the repo root builds both and copies the dashboard into `dist/app`.

Product name, contact, and paths live in `src/config.ts`. `/availability` reads `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` from the parent `.env`.
