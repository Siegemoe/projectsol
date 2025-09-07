# ProjectSol (Frontend)

Memory-first AI platform — MVP web frontend.

This repo contains the Next.js App Router frontend, API proxies, and Supabase auth integration. Security hardening has been applied to API routes and global headers. A dedicated archive/ directory isolates one-off demo/testing files.

## Stack

- Next.js 15 (App Router, TypeScript)
- React 18
- Tailwind CSS
- Supabase (auth via SSR helpers)
- Vercel deploys (Prod = main, Preview = PRs)
- Icon set: lucide-react

## Features

- Auth-protected /app/* area via middleware
- Chat UI with SSE streaming through Edge API route
- Optional in-memory rate limiting for API routes
- Global security headers (CSP, HSTS, COOP/COEP, etc.)
- Email tool demo with resizable preview (client hook)

## Directory overview

- src/app — Next.js App Router pages and API routes
  - src/app/api/sol-chat/route.ts — Edge API proxy to OpenRouter (streaming)
  - src/app/app/* — authenticated application pages (protected by middleware)
- src/components — shared UI components (e.g., SolChat)
- src/hooks — client-side hooks (e.g., useStreamedChat, useDragResize)
- src/lib — browser/server helpers (Supabase, env, rateLimit, sanitize)
- supabase/migrations — database migrations (see SECURITY.md runbook)
- archive — isolated area for demo/testing files retained for reference

## Quickstart

```bash
npm i
cp .env.example .env.local
# Fill in OPENROUTER_API_KEY and NEXT_PUBLIC_SUPABASE_* values
npm run dev
```

Local dev will be available at http://localhost:3000

## Environment variables

Client-visible (NEXT_PUBLIC_*):
- NEXT_PUBLIC_APP_NAME — display name, e.g., Sol
- NEXT_PUBLIC_APP_ENV — development | preview | production
- NEXT_PUBLIC_SUPABASE_URL — project API URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY — project anon key
- NEXT_PUBLIC_BASE_URL — http://localhost:3000 (for local dev)

Server-only:
- OPENROUTER_API_KEY — required for /api/sol-chat
- SITE_URL — used for Referer in upstream requests (defaults to http://localhost:3000)

Legacy (only used by /api/chat):
- OPENAI_API_KEY
- OPENAI_BASE_URL (defaults to https://api.openai.com/v1)
- OPENAI_MODEL (defaults to gpt-5)

API hardening flags:
- REQUIRE_AUTH_FOR_API — 1 to require Supabase-authenticated user for protected APIs (e.g., /api/sol-chat)
- RATE_LIMIT_ENABLED — 1 to enable in-memory sliding-window limiter (Edge best-effort)
- OPENROUTER_ALLOWED_MODELS — comma-separated allowlist accepted by /api/sol-chat (default: deepseek/deepseek-chat)

See .env.example for a full template.

## Scripts

- npm run dev — start local dev server
- npm run lint — lint the project
- npm run build — production build
- npm start — start the production server

## Security and ops notes

- Middleware protection: middleware.ts ensures /app/* requires an authenticated user (redirects to /signin)
- Edge API security: src/app/api/sol-chat/route.ts
  - Validates input schema/size, clamps temperature, trims system prompt
  - Restricts model to OPENROUTER_ALLOWED_MODELS
  - Optional Supabase auth enforcement (REQUIRE_AUTH_FOR_API=1)
  - Optional in-memory rate limiting (RATE_LIMIT_ENABLED=1)
  - Avoids leaking upstream error bodies to clients
- Global security headers: next.config.ts sets HSTS, frame-ancestors 'none', nosniff, CSP, COOP/COEP, etc.
  - If you add external services (analytics, Sentry, etc.), update the CSP connect-src/script-src/img-src lists accordingly.
- Secrets workflow:
  - Never commit .env.local
  - Set env vars in Vercel → Project → Settings → Environment Variables
  - .env.example contains placeholders only

## Routes

- / — home
- /signin — sign-in page
- /app — authenticated area (middleware-protected)
  - /app/chat — chat UI
  - /app/tools/email — email demo tool
- /api/sol-chat — Edge API proxy to OpenRouter (streaming)
- /api/profile, /api/chat — sample API routes
- /demo — disabled; now redirects to / (see archive/ for the original page)

## Deploy

Push to main. Vercel auto-builds. Set required env vars (see above) in:
Vercel → Project → Settings → Environment Variables.

Recommended production flags:
- REQUIRE_AUTH_FOR_API=1
- RATE_LIMIT_ENABLED=1
- OPENROUTER_ALLOWED_MODELS=deepseek/deepseek-chat (update to the models you intend to allow)

## Archive

The archive/ folder contains one-off demo/testing files that should not ship as active routes. See archive/README.md for a current index.
