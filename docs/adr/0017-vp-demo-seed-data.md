## ADR-0017: VP demo seed data

**Status:** Accepted

### Context

The platform supports packs, runs, leaderboards, and run details, but a fresh database is empty.
For leadership demos, we want the UI to look “alive” immediately, without manual data entry or waiting for real model runs to complete.

### Decision

- We will add a **demo seed script** that populates the SQLite database with a small but coherent set of entities:
  - **Benchmarks**:
    - A few representative tasks (e.g., `gsm8k|0`, `truthfulqa:mc|0`, `mmlu|0`) with plausible metadata.
  - **Packs**:
    - At least one hero pack, e.g., “Reasoning Core v1” with the above tasks.
  - **Runs**:
    - A small number of runs tied to the hero pack:
      - mix of `completed`, `running`, and `failed` statuses,
      - varied `scoring_mode` (deterministic, judge, jury).
  - **Scores and metrics**:
    - For completed runs, populate `RunScores.pack_score` and a few `RunTaskMetric` rows per task so that:
      - the leaderboard has meaningful numbers,
      - the run detail page shows per-task metrics.
- The seed script will:
  - use Prisma directly from `apps/api`,
  - be idempotent (upsert-like behavior) so it can be run multiple times,
  - avoid seeding artifacts and details parquet URIs (those come from real LightEval runs).

We will expose the script via `npm run seed:demo` in `apps/api`.

### Consequences

- (+) A fresh checkout can be made demo-ready with a single command.
- (+) Leadership can see populated packs, runs, leaderboards, and run details without additional setup.
- (+) The seeded data clearly illustrates scoring modes and pack behavior.
- (-) The seed data is synthetic; real performance numbers must still come from genuine LightEval runs.

