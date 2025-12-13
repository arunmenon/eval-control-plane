## ADR-0010: JobSpec API contract between platform and runner

**Status:** Proposed

### Context

The evaluation runner is a separate service that executes LightEval evaluations on worker nodes.
To support multiple frontends and queues, the runner needs a stable, explicit job contract that can be versioned over time.
This contract must map cleanly to LightEval concepts (tasks, backends, generation parameters, artifacts) and to our registry objects (BenchmarkPacks, TaskSpecs, TaskPlugins).

### Decision

We define a `JobSpec` as the canonical API contract between the platform and the runner.
At a high level, a `JobSpec` includes:

- **Benchmark and tasks**
  - `benchmark_pack_id` (reference to a `BenchmarkPack` in the registry).
  - `tasks`: explicit list of tasks to run, each with:
    - `id` (LightEval task identifier, built-in or custom),
    - `fewshot`,
    - optional `params` for task parameterization.
- **Model and backend**
  - `backend.type` (e.g., `vllm`, `accelerate`, `endpoint_litellm`, `endpoint_inference_providers`, `custom`).
  - `backend.model_name` and backend-specific options (e.g., provider, base URL, parallelism).
- **Generation parameters**
  - `generation` block for temperature, max tokens, top-p, and related settings.
- **Run configuration**
  - `run_name`, `max_samples`, `num_fewshot_seeds`.
  - `scoring_mode` and scoring configuration (deterministic vs judge vs jury; see ADR-0006).
- **Custom plugins**
  - `custom_plugins`: optional list of task/metric plugins to mount or load.
- **Artifacts**
  - `artifacts.output_dir`: fsspec-compatible output location.
  - `artifacts.save_details`: whether to enable details Parquet.

The runner:

- validates and logs the received `JobSpec`,
- maps it to LightEval pipeline/CLI configuration,
- executes the evaluation,
- writes artifacts according to ADR-0003,
- records enough metadata for ingestion according to ADR-0004 and ADR-0007.

The `JobSpec` is versioned (e.g., via a top-level `jobspec_version`) so that we can evolve fields without breaking existing runners.

### Consequences

- (+) Clear and stable boundary between orchestration and execution.
- (+) Frontends and external systems can submit jobs without knowing LightEval internals, as long as they adhere to the `JobSpec`.
- (+) The runner can be implemented with either CLI-first or Python API usage, as long as it honors the `JobSpec` semantics.
- (+) Easier testing and replay: `JobSpec` + artifacts are sufficient to rerun or inspect a job.
- (-) Requires careful evolution and backward compatibility management of the `JobSpec`.
- (-) Requires validation logic and error reporting when `JobSpec` ⇔ LightEval mapping fails (e.g., invalid tasks or backend options).

