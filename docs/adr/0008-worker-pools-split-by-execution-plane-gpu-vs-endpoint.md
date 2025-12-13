## ADR-0008: Worker pools split by execution plane (GPU vs endpoint)

**Status:** Proposed

### Context

We run a mix of:

- local GPU backends.
- remote endpoint backends.

LightEval’s artifact contract is consistent across these modes, so orchestration can be separated from evaluation logic.

### Decision

- Maintain two queues + worker pools: `gpu` and `endpoint`.
- `backend_type` on the run determines routing.

### Consequences

- (+) Predictable scheduling and scaling.
- (+) Prevents endpoint runs from being blocked by GPU availability.
- (-) Requires minimal operational overhead (two worker deployments).

