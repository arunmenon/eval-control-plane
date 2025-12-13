## ADR-0001: Record architecture decisions

**Status:** Accepted

### Context

We are building an evaluation platform with multiple execution modes (GPU and remote endpoints), multiple scoring strategies (deterministic, judge, jury), and artifact-based provenance. These choices will evolve quickly and need traceability.

### Decision

We will record architecturally significant decisions as ADRs using the Nygard format: Title, Status, Context, Decision, Consequences.
ADRs will live in the repo under `docs/adr/NNNN-<slug>.md`, with monotonic numbering.

### Consequences

- New contributors can understand “why” we did things, not just “what”.
- Reversals become explicit via “Superseded by ADR-XXXX”.
- Small docs remain maintainable compared to big architecture specs.

