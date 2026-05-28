# FlowPilot AI

FlowPilot AI is a demo SaaS-style support workspace showcasing AI-assisted ticket summaries, suggested replies, and structured analysis. It's designed as a portfolio-ready project demonstrating an LLM-backed workflow with cache-first behavior, migrations, and production-safe fallbacks.

## Features

- Unified AI workspace: summary, suggested reply, structured analysis
- DB-backed cache with SQL migrations
- Single-generator prompt to reduce LLM calls and quota usage
- Robust parsing and safe fallbacks (no 500s on malformed LLM output)
- Regenerate cooldown and cached indicators in UI
- Sonner toasts for user feedback

## Tech stack

- Next.js 14 App Router (TypeScript)
- Tailwind CSS + shadcn/ui components
- PostgreSQL via `pg`
- Zod for runtime validation
- Gemini (`@google/generative-ai`) server-side

## Quickstart (local)

1. Copy environment example and set variables:

```bash
cp .env.example .env.local
# set DATABASE_URL, GEMINI_API_KEY, SESSION_SECRET
```

2. Run DB migrations:

```bash
npm run db:migrate
```

3. Run development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm run start
```

## Deployment

- Vercel is recommended for quick deployment. Ensure environment variables are set in the project settings.
- For production scale, consider running migrations during CI/CD, and using Redis for cross-instance generation locks.

## Production Notes

- The app validates and caches AI outputs; regeneration is rate-limited by design to protect API quota.
- Logs are quieted in production; enable DEBUG via `NODE_ENV=development`.
- Replace console logs with a structured logger for observability in larger deployments.

## License

MIT
