## ADR-0011: Judge/jury execution semantics and scoring config propagation

**Status:** Accepted

### Context

We support three scoring modes on runs: `deterministic`, `judge`, and `jury` (see ADR-0006).
Runs can include a `scoring_config` that describes the judge/jury configuration (judge models, backends, max tokens, weights, and aggregation).
LightEval implements judge-based metrics and tasks, but its CLI does not natively understand our platform-specific `scoring_config` structure.
We need a clear execution contract so that:

- judge/jury runs are explicitly distinguishable from deterministic runs,
- judge/jury configuration is available to evaluation code inside LightEval (tasks/metrics),
- we do not hard-code LightEval internals or overfit to a specific judge metric implementation.

### Decision

We adopt the following semantics for scoring modes and scoring configuration:

- **Deterministic runs**
  - `scoring_mode = "deterministic"`.
  - `scoring_config` is optional and ignored by the runner.
  - Tasks and metrics are expected to be purely deterministic (rules/heuristics/reference-based).

- **Judge and jury runs**
  - `scoring_mode ∈ {"judge", "jury"}`.
  - `scoring_config` describes judge models, backends, weights, and aggregation:
    - `judges`: list of `{judge_model_name, judge_backend, max_tokens?, weight?, judge_template_id?}`.
    - `aggregation`: e.g. `"mean"`.
    - `report_disagreement`: boolean indicating whether disagreement metrics should be computed.
  - The runner:
    - stores `scoring_mode` and `scoring_config` on the `runs` row,
    - propagates them to the LightEval process via environment variables:
      - `EVALUATOR_SCORING_MODE` = the run’s `scoring_mode`,
      - `EVALUATOR_SCORING_CONFIG` = JSON-serialized `scoring_config` (if present).
  - LightEval tasks/metrics that implement judge/jury behavior can read these environment variables to choose:
    - which judge metric(s) to invoke,
    - which backend(s) to use,
    - how to aggregate multiple judges (jury).

The LightEval CLI invocation remains the same across scoring modes.
Judge/jury behavior is implemented inside task/metric definitions, guided by the propagated environment configuration.

### Consequences

- (+) Clear semantics:
  - deterministic runs are separated from judge/jury runs by `scoring_mode`,
  - judge/jury configuration is centrally defined and available to evaluation code.
- (+) Decoupling:
  - we do not hard-code LightEval’s internal judge APIs or metrics into the runner,
  - tasks/metrics can evolve independently as long as they honor the `EVALUATOR_SCORING_*` contract.
- (+) UX alignment:
  - the run wizard can collect judge/jury settings,
  - run detail pages can display the exact judge/jury configuration used.
- (-) Requires coordination:
  - custom judge/jury tasks/metrics must be implemented to read `EVALUATOR_SCORING_MODE` and `EVALUATOR_SCORING_CONFIG`.
- (-) At this stage, the runner does not validate that `scoring_config` is actually consumed by the underlying LightEval tasks/metrics; misuse is possible until those components are implemented.

