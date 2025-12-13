## ADR-0003: Artifact contract and storage layout

**Status:** Proposed

### Context

The platform’s leaderboard and run-detail UX must be driven by immutable artifacts. LightEval saves:

- results: `{output_dir}/results/{model_name}/results_{timestamp}.json`
- details: `{output_dir}/details/{model_name}/{timestamp}/details_{task}_{timestamp}.parquet` (when enabled)

It also supports saving to any fsspec-compliant path (S3, GDrive, etc.) and custom path templates via `results-path-template`.

### Decision

- We will store **results JSON** and **details parquet** in object storage (or any fsspec path).
- We will store URIs in DB, plus store a copy of the parsed results JSON as JSONB for fidelity.
- We will use `results-path-template` to embed our platform `run_id` into the artifact path when possible.

### Consequences

- (+) UI can always reconstruct a run from artifacts.
- (+) Works for both local and remote execution (fsspec abstraction).
- (-) Requires storage lifecycle policy (retention / privacy).
- (-) Requires careful permissions for details data.

