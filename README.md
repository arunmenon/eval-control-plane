# Eval Control Plane (LightEval-powered)

This repository is a small evaluation control plane built on top of [LightEval](https://huggingface.co/docs/lighteval), with a focus on:

- **Benchmarks** (tasks): definitions of what to evaluate.
- **Packs**: curated bundles of benchmarks and a scoring policy.
- **Runs**: executions of a model on a pack.
- **Metrics**: deterministic and judge/jury scores for leaderboards and drilldowns.

It includes:

- A Node/TypeScript API (`apps/api`) using Prisma + SQLite.
- A Next.js web UI (`apps/web`) with packs, runs, leaderboards, and run detail views.
- Seed scripts for demo data:
  - Reasoning Core v1 (math + truthfulness).
  - Conversation Core v1 (routing, tools, and conversation helpfulness).

All significant decisions are captured as Architecture Decision Records (ADRs) under `docs/adr/`.

## Concepts

- **Benchmark** (Task):
  - A single evaluation definition: dataset + prompt mapping + metrics.
  - In LightEval terms, a `LightevalTaskConfig`.
  - In the DB, a row in `benchmarks` (e.g., `gsm8k|0`, `conv_tool_routing`).

- **Pack**:
  - A curated set of benchmarks plus a scoring policy.
  - In the DB, a row in `packs` plus `pack_tasks`.
  - Used as the unit for leaderboards (e.g., `Reasoning Core v1`, `Conversation Core v1`).

- **Run**:
  - One execution of a model on a pack.
  - In the DB, a row in `runs` plus associated artifacts and metrics.
  - Exposed in the UI under `/runs` and `/runs/:runId`.

- **Metric**:
  - How we score a benchmark or pack.
  - Can be:
    - **Deterministic** (rules/heuristics/ground truth) – e.g., `intent_accuracy`, `tool_success_rate`.
    - **Judge/Jury** (LLM-as-judge) – e.g., `helpfulness_score`, `overall_judge_score`.
  - Stored in `run_task_metrics` and `run_scores`.

## Architecture (high level)

- **API** (`apps/api`):
  - Fastify + TypeScript.
  - Prisma schema in `apps/api/prisma/schema.prisma` (currently using SQLite for local dev).
  - Key endpoints:
    - `GET /api/benchmarks`, `GET /api/benchmarks/:benchmarkKey`, `GET /api/benchmarks/:benchmarkKey/inspect`
    - `GET /api/packs`, `GET /api/packs/:packId`
    - `POST /api/runs`, `GET /api/runs`, `GET /api/runs/:runId`
    - `GET /api/leaderboards/:packId`
    - `GET /api/runs/:runId/tasks/:taskKey/details` (sample explorer)
    - `GET /api/runs/compare?runIdA=&runIdB=` (run comparison)
  - LightEval integration:
    - Runs LightEval via CLI (`lighteval eval`) for real runs.
    - Ingests results JSON and optional details parquet into normalized tables.

- **Runner** (`services/runner`):
  - Python + Pydantic + Typer.
  - Defines a `JobSpec` schema matching the API.
  - Ready to be extended to run LightEval via Python API.

- **Web UI** (`apps/web`):
  - Next.js 14 app router.
  - Routes:
    - `/` – dashboard hero, summary metrics, recent runs, top packs.
    - `/benchmarks`, `/benchmarks/:benchmarkKey` – catalog and tabbed detail.
    - `/packs`, `/packs/:packId` – pack list and detail.
    - `/runs`, `/runs/new`, `/runs/:runId` – runs list, run wizard, run detail.
    - `/runs/:runId/tasks/:taskKey/details` – sample explorer (from parquet).
    - `/runs/compare` – compare two runs side-by-side.
    - `/leaderboards/:packId` – leaderboard for a pack.

## ADRs

All major decisions live under `docs/adr/`. Some key ones:

- `0001` – ADR practice and location.
- `0002`–`0004` – LightEval CLI integration, artifact contract, results JSON as source of truth.
- `0005` – Benchmark registry from LightEval task discovery.
- `0006` – Explicit scoring modes (deterministic vs judge vs jury).
- `0007` – Details parquet read-on-demand for sample explorer.
- `0009`–`0011` – Registry → Runner → Results, JobSpec, scoring config propagation.
- `0012` – Judge/jury plugins and pack mapping.
- `0013` – SQLite for local development.
- `0014`–`0016` – Web UX layout and visual theme.
- `0021`–`0022` – Conversation agents benchmarks, packs, and Conversation Core v1.

Read these first if you want to understand the design choices.

## Getting started (local dev)

### API (SQLite)

From the repo root:

```bash
cd apps/api

# Install dependencies
npm install

# Point Prisma at a local SQLite file
export DATABASE_URL='file:./dev.db'

# Run migrations and generate Prisma client
npm run prisma:migrate
npm run prisma:generate

# Seed demo data (Reasoning Core + Conversation Core)
npm run seed:demo

# Start API on http://localhost:4000
npm run dev
```

### Web UI

In a second terminal:

```bash
cd apps/web
npm install

export NEXT_PUBLIC_API_BASE_URL='http://localhost:4000'
npm run dev
```

Open `http://localhost:3000` in your browser.

## Demo packs (what you should see)

After `npm run seed:demo` and starting both API and web:

- Packs:
  - `Reasoning Core v1` – math + truthfulness (seeded).
  - `Conversation Core v1` – routing, tools, and helpfulness (seeded).
- Leaderboards for each pack with a couple of demo models pre-populated.
- Rich run detail pages with:
  - status and scoring mode,
  - pack scores and per-task metrics,
  - sample explorer for runs with details.

## Next steps

- Wire real LightEval tasks for the conversation benchmarks using your golden dataset
  (`reasoning-model-trainer/examples/multi_turn_traces_eval.jsonl`).
- Add a job queue and worker pools (GPU vs endpoint) if you want to move beyond a single-process demo.
- Customize judge/jury plugins to reflect your organization’s conversation quality standards.

