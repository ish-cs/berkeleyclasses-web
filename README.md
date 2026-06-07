# berkeleyclasses.com

The UC Berkeley class schedule, the way it should be. Search every section, build conflict-free schedules, compare classes side-by-side, get emailed when a seat opens.

Powered by [berkeley-classes-cli](https://github.com/ish-cs/berkeley-classes-cli) for ingestion, Supabase for data + auth, Next.js for the UI.

## Local dev

```bash
pnpm install
# Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
pnpm dev
```

## Stack

- Next.js 16 (App Router, Turbopack)
- Supabase (Postgres + Auth — Google with `@berkeley.edu` gate)
- Tailwind CSS v4
- Deployed on Vercel
