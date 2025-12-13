## ADR-0002: LightEval integration via CLI-first runner

**Status:** Proposed

### Context

We need a reliable end-to-end integration quickly, across multiple LightEval backends. We also need consistent artifacts (results JSON + optional details parquet) for the UI and leaderboard. LightEval has a well-defined save contract via `--output-dir` and optional `--save-details`.

### Decision

We will integrate LightEval using a **CLI-first** runner inside a worker container:

- Worker constructs and executes the LightEval CLI command.
- Worker writes artifacts to `--output-dir` (fsspec path supported) and then ingests results into DB.

### Consequences

- (+) Fastest path to stable execution across backends.
- (+) No tight coupling to LightEval internal Python API changes.
- (-) Less in-process control/telemetry (mitigated by capturing stdout/stderr + storing artifact URIs).
- (-) Requires robust parsing + idempotency in ingestion.

