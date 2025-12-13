## ADR-0005: Benchmark registry from LightEval task discovery + pack curation

**Status:** Proposed

### Context

We need a benchmark catalog UI that reflects the underlying engine. LightEval supports:

- `lighteval tasks list` to list tasks by suite.
- `lighteval tasks inspect <task_name>` to view config/metrics/requirements.

### Decision

- Our Benchmark Catalog will ingest tasks from `tasks list/inspect` and store them as benchmarks.
- Our Packs will reference tasks using canonical task specs (e.g., `truthfulqa:mc|0`).

### Consequences

- (+) Catalog stays aligned with LightEval.
- (+) “Onboarding” an existing benchmark is just “add to pack”.
- (-) Requires periodic refresh to track LightEval updates.

