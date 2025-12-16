# Repository Guidelines

This repo is a small eval control plane built on LightEval, organized as a polyglot monorepo.

## Project Structure & Modules

- `apps/api` – Fastify + TypeScript API, Prisma schema in `apps/api/prisma/schema.prisma`, SQLite for local dev.
- `apps/web` – Next.js 14 app router UI (TypeScript, React).
- `services/runner` – Python LightEval-based runner (`evaluator-runner` entry point).
- `docs/adr` – Architecture Decision Records; read `0001` and recent ADRs before major changes.

## Build, Test & Development

- API: `cd apps/api`
  - `npm install` – install dependencies.
  - `npm run prisma:migrate && npm run prisma:generate` – migrate DB and generate client.
  - `npm run dev` – start API (expects `DATABASE_URL` for SQLite).
- Web: `cd apps/web`
  - `npm install` – install dependencies.
  - `npm run dev` – start Next.js on port 3000 (configure `NEXT_PUBLIC_API_BASE_URL`).
- Runner: `cd services/runner && pip install .` – install the Python package; run via `evaluator-runner`.

## Coding Style & Naming

- TypeScript: prefer explicit types at module boundaries; use `camelCase` for variables/functions, `PascalCase` for components and classes, and `SCREAMING_SNAKE_CASE` for constants.
- Python: follow PEP 8; `snake_case` for functions/variables and `PascalCase` for classes.
- Keep modules small and domain-focused (benchmarks, packs, runs, metrics); align with concepts in `README.md` and ADRs.

## Testing Guidelines

- Add tests alongside new features or bug fixes (co-located `*.test.ts(x)` for TS/Next, `tests/` with `test_*.py` for Python).
- Prefer fast, deterministic tests; when using LightEval, keep external calls mockable.
- Ensure seeds and migrations are covered by at least a smoke test when they change.

## Commit & Pull Request Practices

- Commits: write clear, present-tense summaries (e.g., `Add pack leaderboard view`, `Fix run comparison query`).
- PRs: include a short description, key screenshots for UI changes, and links to relevant ADRs or issues.
- Call out schema changes (Prisma + SQLite) and required env vars; note any migration or backfill steps.

