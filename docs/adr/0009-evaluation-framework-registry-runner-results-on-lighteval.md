## ADR-0009: Evaluation framework architecture: Registry → Runner → Results on LightEval

**Status:** Proposed

### Context

Our goal is to build an evaluation platform that can onboard many benchmarks and run them consistently across many model backends.
LightEval already provides task definitions, metrics, backends, caching, per-sample details, and result exporting.
We need a clear platform architecture that layers on top of LightEval without re-implementing its core functionality.

### Decision

We will structure the platform around three core subsystems:

- **Registry**
  - Stores benchmark definitions as data, not ad-hoc scripts.
  - Key concepts:
    - `BenchmarkPack`: curated collection of tasks with aggregation and policy.
    - `TaskSpec`: reference to a LightEval task (built-in or custom) plus parameters (few-shot, variants).
    - `TaskPlugin`: versioned artifact for custom tasks/metrics, with explicit dependencies.
- **Runner**
  - A job-execution service that:
    - pulls a `JobSpec` from the API/queue,
    - constructs and runs a LightEval evaluation (CLI-first and/or Python API),
    - writes artifacts to object storage,
    - reports status and basic telemetry.
  - Selects the appropriate LightEval backend (e.g., vLLM, Accelerate, LiteLLM, inference providers, custom models) based on the job configuration.
- **Results**
  - Ingests LightEval result artifacts:
    - JSON results as the source of truth (see ADR-0004),
    - optional details Parquet for sample-level drilldowns (see ADR-0007).
  - Normalizes enough data for:
    - leaderboards,
    - run comparison,
    - governance (reproducibility, approvals, access control).

This architecture treats LightEval as the execution engine and our platform as orchestration, registry, and UX on top.

### Consequences

- (+) Clean separation of concerns:
  - LightEval remains responsible for evaluation logic.
  - The platform focuses on registry, scheduling, and UX.
- (+) Benchmark onboarding is standardized:
  - adding a benchmark becomes “add or update a `TaskSpec`/`TaskPlugin` and include it in a `BenchmarkPack`”.
- (+) Runner logic is centralized and can evolve (e.g., from pure CLI to Python API) without changing the registry or results schema.
- (+) Results and leaderboards can be extended (e.g., comparisons, slices) without changing how runs are executed.
- (-) Requires careful versioning and migration of registry entries (packs, task specs, plugins).
- (-) Requires explicit contracts between Registry ↔ Runner (JobSpec) and Runner ↔ Results (artifact schemas).

