## ADR-0006: Explicit scoring modes: deterministic vs judge vs jury

**Status:** Proposed

### Context

Executives and engineers must never confuse deterministic scores with judge-based scores. LightEval supports judge scoring via judge classes and allows choosing judge backends including `litellm`, `openai`, `transformers`, `tgi`, `vllm`, `inference-providers`.
HF guidance also emphasizes LLM-as-judge won’t work well “out of the box” and needs careful setup and reliability checks.

### Decision

- Runs must declare exactly one `scoring_mode ∈ {deterministic, judge, jury}`.
- UI must show a badge everywhere (catalog, runs, leaderboard).
- For judge/jury runs, store:
  - judge model identity
  - judge backend
  - judge template version
  - parsing rules / schema
- Jury is implemented as “N judges + aggregation + disagreement”.

### Consequences

- (+) Clarity and governance: stakeholders understand what a score means.
- (+) Enables “comparability” filters (only compare same `scoring_mode`).
- (-) More configuration burden; mitigated via templates and defaults.

