# ProjectSol (Frontend)

Memory-first AI platform — MVP web frontend.

## Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Vercel deploys (Prod = main, Preview = PRs)
- /api/chat -> GPT-5 (OpenAI-compatible)

## Quickstart
```bash
npm i
cp .env.example .env.local
# add OPENAI_API_KEY, optionally OPENAI_BASE_URL and OPENAI_MODEL
npm run dev
```

## Env
- NEXT_PUBLIC_APP_ENV: development | preview | production
- OPENAI_API_KEY: required server-side
- OPENAI_BASE_URL: optional, defaults to https://api.openai.com/v1
- OPENAI_MODEL: default gpt-5

## Develop
- npm run dev - start local dev server
- npm run lint - lint the project
- npm run build - production build
- npm start - start the production server

## Deploy
Push to `main`. Vercel auto-builds. Set env vars in:
Vercel → Project → Settings → Environment Variables.

Required:
- NEXT_PUBLIC_APP_NAME=Sol
- NEXT_PUBLIC_APP_ENV=production (Preview: preview)
- OPENAI_API_KEY=...

Optional:
- OPENAI_MODEL=gpt-5
- OPENAI_BASE_URL=https://api.openai.com/v1
