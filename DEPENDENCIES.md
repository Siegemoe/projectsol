# Dependencies

Summary of runtime and development dependencies used by this frontend, with brief rationale and notes.

## Runtime

- next (15.x)
  - Next.js App Router runtime and build toolchain. Provides SSR/SSG, routing, API routes (Edge/runtime:node), image optimization, etc.
- react, react-dom (18.x)
  - Core React libraries for rendering UI and React 18 features (concurrent rendering, hooks).
- lucide-react
  - Lightweight icon set used across UI (toolbar, buttons, etc.).
- @supabase/supabase-js
  - Supabase client SDK. Used with SSR helpers to manage auth session in middleware and server code.
- @supabase/ssr
  - Supabase helpers tailored for Next.js SSR/App Router (createServerClient, createBrowserClient). Ensures auth sessions are read/written via cookies correctly in middleware/edge handlers.

## Dev

- typescript
  - Type-checking and project tooling.
- @types/node, @types/react, @types/react-dom
  - Type definitions for Node.js/React.
- eslint, eslint-config-next
  - Linting with Next.js recommended rules.
- tailwindcss, postcss, autoprefixer
  - Utility-first CSS and build-time processing of styles.

## Internal Utilities (no external dep)

- src/lib/rateLimit.ts
  - Best-effort, in-memory sliding-window limiter designed to work in Edge runtime. No external store; for global consistency a remote store (e.g., Upstash) can be added behind env flags later.
- src/hooks/useStreamedChat.ts
  - Encapsulates SSE streaming for chat completions to keep components small and testable.
- src/hooks/useDragResize.ts
  - Encapsulates drag-to-resize logic for the email preview pane.
- src/lib/sanitize.ts
  - Client-side coercion/normalization helpers for folders/search strings.

## Security-related config and env

- next.config.ts
  - Adds global security headers (CSP, HSTS, frame-ancestors 'none', COOP/COEP, etc.).
- src/app/api/sol-chat/route.ts
  - Edge API hardened with input validation, optional auth (REQUIRE_AUTH_FOR_API), optional in-memory rate limiting (RATE_LIMIT_ENABLED), and a model allowlist (OPENROUTER_ALLOWED_MODELS).
- .env.example
  - Template for required and optional env variables. Do not commit secrets (.env.local is ignored).

## Optional/Pluggable (not currently added)

- Upstash Ratelimit / Redis store
  - If strict, globally consistent rate limiting is required across regions and instances, integrate a remote rate limiter. Current implementation is best-effort in-memory per instance.

## Notes

- No additional runtime dependencies were introduced for security features; all hardening was implemented with platform primitives and small internal utilities.
- If you add external analytics/telemetry/CDN or additional model providers, update next.config.ts CSP and .env.example accordingly.
