## ADR-0007: Details Parquet is read-on-demand (no sample rows in DB)

**Status:** Proposed

### Context

Details files include rich per-sample data, but can be large. LightEval details parquet includes columns:

- `__doc__`
- `__model_response__`
- `__metric__`

### Decision

- We will not ingest sample rows into Postgres.
- We will:
  - store parquet URIs per task.
  - expose a paginated API that reads parquet and returns rows for the UI sample explorer.

### Consequences

- (+) Keeps DB lean and fast.
- (+) Enables “wow” debugging UX without huge storage costs in DB.
- (-) Requires parquet reader service and careful authorization.

