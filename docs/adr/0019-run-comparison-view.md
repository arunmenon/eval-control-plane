## ADR-0019: Run comparison view

**Status:** Accepted

### Context

The platform supports viewing individual runs and leaderboards, but stakeholders often want to compare two runs directly:

- same pack, different models,
- same model, different scoring modes,
- or different backends.

A dedicated comparison view improves explainability and decision making.

### Decision

- We will add a **run comparison** endpoint and page:
  - API:
    - `GET /api/runs/compare?runIdA=&runIdB=`
    - Returns `runA` and `runB`, each including:
      - basic run info (model, backend, scoring_mode, status),
      - `scores` (pack_score),
      - `taskMetrics` for per-task metrics.
  - UI:
    - New page at `/runs/compare` using `searchParams.runIdA` and `searchParams.runIdB`.
    - Layout:
      - Top section: two columns summarizing each run (model, backend, scoring mode, pack score).
      - Below: a per-task table showing metrics side-by-side where both runs have values for the same task/metric.
    - If either run is missing, the page will show a clear error message.

This view is read-only and uses existing data; it does not change how runs are created or evaluated.

### Consequences

- (+) Leadership can compare two runs directly without manually switching tabs.
- (+) Differences in models, backends, and scoring modes are clearly visible.
- (+) The view reuses existing run and metric data, minimizing backend changes.
- (-) For more complex multi-run comparisons, additional views or filters may be needed later.

