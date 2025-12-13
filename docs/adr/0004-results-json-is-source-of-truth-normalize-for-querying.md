## ADR-0004: Results JSON is source of truth; normalize for querying

**Status:** Proposed

### Context

LightEval’s results JSON is structured and includes the sections we need:

- `config_general`, `summary_general`
- `config_tasks`, `summary_tasks`, `versions`
- `results`

Leaderboards need fast querying and filtering; run pages need full fidelity.

### Decision

- Store the full results JSON (unaltered) in `run_artifacts.results_json`.
- Normalize:
  - per-task metrics from `results[task_key]`
  - task hashes from `summary_tasks[task_key].hashes`
  - pack score computed by our pack policy (mean/weighted mean of a primary metric).

### Consequences

- (+) Perfect auditability (raw JSON) + fast leaderboard queries.
- (+) Easy to add new metrics without schema migrations (raw JSON still present).
- (-) Requires ingestion logic versioning (store `ingester_version`).

